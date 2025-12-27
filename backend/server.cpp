#include <iostream>
#include <string>
#include <fstream>
#include <sstream>
#include <vector>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <direct.h>
#include <algorithm>
#include <cmath>
#include <iomanip>

#pragma comment(lib, "ws2_32.lib")

const int PORT = 8080;
const int BUFFER_SIZE = 1024 * 16; // Increased buffer for larger JSON payloads

// --- Helper Utilities ---

std::string get_mime_type(const std::string& path) {
    if (path.find(".html") != std::string::npos) return "text/html";
    if (path.find(".css") != std::string::npos) return "text/css";
    if (path.find(".js") != std::string::npos) return "application/javascript";
    if (path.find(".png") != std::string::npos) return "image/png";
    if (path.find(".jpg") != std::string::npos) return "image/jpeg";
    if (path.find(".ico") != std::string::npos) return "image/x-icon";
    if (path.find(".svg") != std::string::npos) return "image/svg+xml";
    return "text/plain";
}

void send_response(SOCKET client_socket, const std::string& status, const std::string& content_type, const std::string& body) {
    std::ostringstream response;
    response << "HTTP/1.1 " << status << "\r\n";
    response << "Content-Type: " << content_type << "\r\n";
    response << "Content-Length: " << body.size() << "\r\n";
    response << "Connection: close\r\n";
    response << "Access-Control-Allow-Origin: *\r\n";
    response << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    response << "Access-Control-Allow-Headers: Content-Type\r\n";
    response << "\r\n";
    response << body;

    send(client_socket, response.str().c_str(), response.str().size(), 0);
}

// --- JSON Parsers (Manual & Simple) ---

double extract_double(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return 0.0;
    
    pos += search.length();
    // Skip optional spaces, colon, optional spaces, and optional starting quote
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == ':' || json[pos] == '"')) pos++;
    
    size_t end = pos;
    // Capture digits, dots, minus sign
    while (end < json.length() && (isdigit(json[end]) || json[end] == '.' || json[end] == '-')) end++;
    
    if (pos == end) return 0.0;
    std::string val = json.substr(pos, end - pos);
    try {
        return std::stod(val);
    } catch (...) {
        return 0.0;
    }
}

// Helper to determine if a key is explicitly null, missing, or an empty string
bool is_null(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return true;
    
    pos += search.length();
    // Skip spaces and colon
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == ':')) pos++;
    
    // Check for null literal
    if (pos + 4 <= json.length() && json.substr(pos, 4) == "null") return true;
    // Check for empty string ""
    if (pos + 2 <= json.length() && json.substr(pos, 2) == "\"\"") return true;
    
    // Check if the next character is not a digit, dot, or minus (implies missing/invalid/empty)
    if (pos < json.length() && !isdigit(json[pos]) && json[pos] != '.' && json[pos] != '-' && json[pos] != '"') return true;

    return false;
}

// Helper to find all occurrences of subjects for GPA
struct Subject {
    double credits;
    double gradePoint;
};

std::vector<Subject> parse_subjects(const std::string& json) {
    std::vector<Subject> subjects;
    size_t pos = 0;
    while (true) {
        // Find next object start
        pos = json.find('{', pos);
        if (pos == std::string::npos) break;
        
        // Find matching close
        size_t end = json.find('}', pos);
        if (end == std::string::npos) break;
        
        std::string obj = json.substr(pos, end - pos + 1);
        
        // Only add if it seems to be a subject
        if (obj.find("\"credits\"") != std::string::npos) {
            Subject sub;
            sub.credits = extract_double(obj, "credits");
            sub.gradePoint = extract_double(obj, "gradePoint");
            subjects.push_back(sub);
        }
        
        pos = end + 1;
    }
    return subjects;
}

// --- Logic Implementation ---

std::string handle_calculate_gpa(const std::string& body) {
    auto subjects = parse_subjects(body);
    double totalCredits = 0;
    double totalPoints = 0;
    
    for (const auto& sub : subjects) {
        totalCredits += sub.credits;
        totalPoints += (sub.credits * sub.gradePoint);
    }
    
    double gpa = (totalCredits == 0) ? 0.0 : (totalPoints / totalCredits);
    
    std::ostringstream oss;
    oss << "{ \"gpa\": " << std::fixed << std::setprecision(2) << gpa << " }";
    return oss.str();
}

std::string handle_attendance(const std::string& body) {
    double total = extract_double(body, "total");
    double conducted = extract_double(body, "conducted");
    double attended = extract_double(body, "attended");
    double target = extract_double(body, "target");
    if (target <= 0) target = 85.0;
    
    // Fallback: If total is 0 but conducted is set, assume simple tracking
    if (total == 0 && conducted > 0) total = conducted; 
    
    // Safety for fresh subjects
    if (total == 0) {
        return "{ \"percentage\": \"0.00\", \"status\": \"safe\", \"count\": 0, \"message\": \"No classes scheduled yet.\" }";
    }

    double currentPercentage = (conducted == 0) ? 0.0 : (attended / conducted) * 100.0;
    double requiredRatio = target / 100.0;
    double remaining = total - conducted;
    
    std::ostringstream oss;
    oss << "{ \"percentage\": \"" << std::fixed << std::setprecision(2) << currentPercentage << "\", ";
    
    double maxPossible = (total == 0) ? 0.0 : (attended + remaining) / total * 100.0;
    
    if (maxPossible < target) {
        oss << "\"status\": \"critical\", ";
        oss << "\"message\": \"Impossible! Max possible: " << std::fixed << std::setprecision(2) << maxPossible << "%\"";
    } else {
        double needed = (requiredRatio * total) - attended;
        if (needed <= 0) {
            double bunkable = (attended + remaining) - (requiredRatio * total);
             oss << "\"status\": \"safe\", ";
             oss << "\"count\": " << (int)floor(bunkable) << ", ";
             oss << "\"message\": \"Safe! You can bunk <strong>" << (int)floor(bunkable) << "</strong> classes.\"";
        } else {
             oss << "\"status\": \"warning\", ";
             oss << "\"count\": " << (int)ceil(needed) << ", ";
             oss << "\"message\": \"You must attend <strong>" << (int)ceil(needed) << "</strong> more classes.\"";
        }
    }
    oss << " }";
    return oss.str();
}

std::string handle_cie(const std::string& body) {
    double cie1 = extract_double(body, "cie1");
    double cie2 = extract_double(body, "cie2");
    double cie3 = extract_double(body, "cie3");
    double targetAvg = extract_double(body, "targetAvg");
    if (targetAvg <= 0) targetAvg = 13.0;
    
    int count = 0;
    double sum = 0;
    
    if (!is_null(body, "cie1")) { count++; sum += cie1; }
    if (!is_null(body, "cie2")) { count++; sum += cie2; }
    if (!is_null(body, "cie3")) { count++; sum += cie3; }
    
    std::ostringstream oss;
    oss << "{ ";
    
    if (count == 3) {
        double avg = sum / 3.0;
        oss << "\"eligible\": " << (avg >= targetAvg ? "true" : "false") << ", ";
        oss << "\"message\": \"" << (avg >= targetAvg ? "Eligible" : "Not Eligible") << " (Avg: " << std::fixed << std::setprecision(1) << avg << ")\"";
    } else {
        double needed = (targetAvg * 3) - sum;
        int remaining = 3 - count;
        
        // Safety against division by zero though count < 3 implies remaining >= 1
        if (remaining <= 0) remaining = 1; 
        
        double avgNeeded = needed / remaining;
        
        if (avgNeeded > 30) {
            oss << "\"eligible\": false, \"message\": \"Impossible to be eligible. Need " << (int)needed << " marks in next " << remaining << " CIEs.\"";
        } else if (avgNeeded <= 0) {
             oss << "\"eligible\": true, \"message\": \"Already Eligible! (Current Total: " << (int)sum << ")\"";
        } else {
             oss << "\"eligible\": \"pending\", ";
             oss << "\"message\": \"Need avg <strong>" << std::fixed << std::setprecision(1) << avgNeeded << "</strong> in next " << remaining << " CIE(s).\"";
        }
    }
    oss << " }";
    return oss.str();
}

// --- Server Core ---

void send_file(SOCKET client_socket, const std::string& filepath) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file) {
        std::string body = "<h1>404 Not Found</h1>";
        send_response(client_socket, "404 Not Found", "text/html", body);
        return;
    }

    std::ostringstream ss;
    ss << file.rdbuf();
    std::string body = ss.str();
    send_response(client_socket, "200 OK", get_mime_type(filepath), body);
}

void handle_client(SOCKET client_socket) {
    try {
        char buffer[BUFFER_SIZE];
        int bytes_received = recv(client_socket, buffer, BUFFER_SIZE - 1, 0);
        if (bytes_received < 0) {
            closesocket(client_socket);
            return;
        }
        buffer[bytes_received] = '\0';

        std::string request(buffer);
        std::istringstream iss(request);
        std::string method, path;
        iss >> method >> path;

        std::cout << "Request: " << method << " " << path << std::endl;
        
        std::string body = "";
        size_t body_pos = request.find("\r\n\r\n");
        if (body_pos != std::string::npos) {
            body = request.substr(body_pos + 4);
        }

        if (method == "GET") {
            if (path == "/api/cpp-test") {
                send_response(client_socket, "200 OK", "application/json", "{\"message\": \"Hello from C++ backend!\"}");
            } else {
                // Serve static files - check ./dist first, then ../dist
                std::string file_path = "dist";
                std::ifstream check(file_path + "/index.html");
                if (!check) {
                    file_path = "../dist";
                } else {
                    check.close();
                }

                if (path == "/") {
                    file_path += "/index.html";
                } else {
                    file_path += path;
                }
                send_file(client_socket, file_path);
            }
        } 
        else if (method == "POST") {
            if (path == "/api/calculate-gpa") {
                 std::string result = handle_calculate_gpa(body);
                 send_response(client_socket, "200 OK", "application/json", result);
            }
            else if (path == "/api/calculate-attendance") {
                 std::string result = handle_attendance(body);
                 send_response(client_socket, "200 OK", "application/json", result);
            }
            else if (path == "/api/calculate-cie") {
                std::string result = handle_cie(body);
                send_response(client_socket, "200 OK", "application/json", result);
            }
            else {
                 send_response(client_socket, "404 Not Found", "text/plain", "Endpoint not found");
            }
        }
        else if (method == "OPTIONS") {
             send_response(client_socket, "200 OK", "text/plain", "");
        }
        else {
            send_response(client_socket, "405 Method Not Allowed", "text/plain", "Method Not Allowed");
        }
    } catch (const std::exception& e) {
        std::cerr << "SERVER ERROR: " << e.what() << std::endl;
        send_response(client_socket, "500 Internal Server Error", "text/plain", "Internal Server Error");
    } catch (...) {
        std::cerr << "UNKNOWN SERVER ERROR" << std::endl;
        send_response(client_socket, "500 Internal Server Error", "text/plain", "Internal Server Error");
    }

    closesocket(client_socket);
}

int main() {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "WSAStartup failed" << std::endl;
        return 1;
    }

    SOCKET server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket == INVALID_SOCKET) {
        std::cerr << "Socket creation failed" << std::endl;
        WSACleanup();
        return 1;
    }

    sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    if (bind(server_socket, (sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed" << std::endl;
        closesocket(server_socket);
        WSACleanup();
        return 1;
    }

    if (listen(server_socket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "Listen failed" << std::endl;
        closesocket(server_socket);
        WSACleanup();
        return 1;
    }

    std::cout << "C++ Server running on http://localhost:" << PORT << std::endl;
    std::cout << "Make sure you have run 'npm run build' first!" << std::endl;

    while (true) {
        SOCKET client_socket = accept(server_socket, NULL, NULL);
        if (client_socket == INVALID_SOCKET) {
            std::cerr << "Accept failed" << std::endl;
            continue;
        }
        handle_client(client_socket);
    }

    closesocket(server_socket);
    WSACleanup();
    return 0;
}
