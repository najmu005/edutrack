export const Calculator = {
    async calculateSGPA(subjects) {
        try {
            const response = await fetch('http://localhost:8080/api/calculate-gpa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subjects)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            return result.gpa;
        } catch (error) {
            console.error("Error calculating SGPA:", error);
            return 0;
        }
    },

    async calculateCGPA(semesters) {
        let allSubjects = [];
        semesters.forEach(sem => {
            if (sem.subjects) {
                allSubjects = allSubjects.concat(sem.subjects);
            }
        });

        try {
            const response = await fetch('http://localhost:8080/api/calculate-gpa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allSubjects)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            return result.gpa;
        } catch (error) {
            console.error("Error calculating CGPA:", error);
            return 0;
        }
    },

    getGradePoint(marks) {
        if (marks >= 90) return 10;
        if (marks >= 80) return 9;
        if (marks >= 70) return 8;
        if (marks >= 60) return 7;
        if (marks >= 50) return 6;
        if (marks >= 40) return 5;
        return 0;
    },

    async calculateAttendanceStatus(totalCourse, conducted, attended, targetPercentage = 85) {
        try {
            const response = await fetch('http://localhost:8080/api/calculate-attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    total: totalCourse,
                    conducted: conducted,
                    attended: attended,
                    target: targetPercentage
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Error calculating Attendance:", error);
            return { percentage: "0.00", status: "normal", message: "Error connecting to backend." };
        }
    },

    async calculateCIEEligibility(cie1, cie2, cie3, targetAvg = 13) {
        try {
            const response = await fetch('http://localhost:8080/api/calculate-cie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cie1: cie1,
                    cie2: cie2,
                    cie3: cie3,
                    targetAvg: targetAvg
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Error calculating CIE:", error);
            return { eligible: false, message: "Backend Error" };
        }
    }
};
