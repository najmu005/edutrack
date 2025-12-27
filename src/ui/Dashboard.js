import { DataModel } from '../logic/DataModel.js';
import { setupGoalCalculator } from './GoalCalculator.js';

export function setupDashboard(element) {
    const data = DataModel.getData();
    const allProfiles = DataModel.getAllProfiles();
    const activeProfile = DataModel.getActiveProfile();

    element.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold">Dashboard</h2>
            
            <!-- Profile Switcher -->
            <div class="flex items-center space-x-2">
                <select id="profile-switcher" class="form-select text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                    ${allProfiles.map(p => `
                        <option value="${p.id}" ${p.id === activeProfile.id ? 'selected' : ''}>${p.name}</option>
                    `).join('')}
                </select>
                <button id="add-profile-btn" class="btn btn-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2 py-1 rounded" title="Add Friend/Profile">
                    +
                </button>
            </div>
        </div>
        
        <!-- Profile Card -->
        <div class="card mb-8">
            <div class="flex flex-col md:flex-row justify-between items-center">
                <div class="mb-4 md:mb-0">
                    <h3 class="text-2xl font-bold text-gray-800" id="student-name">${data.student.name}</h3>
                    <p class="text-gray-500">Roll No: <span id="student-roll">${data.student.rollNo}</span> | <span id="student-major">${data.student.major}</span></p>
                </div>
                <div class="text-center md:text-right">
                    <div class="text-sm text-gray-500 uppercase tracking-wide font-semibold">Overall CGPA</div>
                    <div class="text-5xl font-bold text-primary">${data.student.cgpa || '0.00'}</div>
                </div>
            </div>
            <div class="flex justify-between items-center mt-4">
                 <button id="edit-profile-btn" class="text-accent text-sm font-semibold hover:underline">Edit Profile</button>
                 ${allProfiles.length > 1 ? '<button id="delete-profile-btn" class="text-red-400 text-xs hover:text-red-600">Delete Profile</button>' : ''}
            </div>
        </div>

        <!-- Edit Profile Modal (Hidden by default) -->
        <div id="edit-profile-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg w-full max-w-md mx-4 shadow-xl">
                <h3 class="text-xl font-bold mb-4">Edit Profile</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" id="edit-name" class="input-field mt-1" value="${data.student.name}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Roll Number</label>
                        <input type="text" id="edit-roll" class="input-field mt-1" value="${data.student.rollNo}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Major</label>
                        <input type="text" id="edit-major" class="input-field mt-1" value="${data.student.major}">
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button id="cancel-edit-btn" class="btn text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button id="save-profile-btn" class="btn btn-primary">Save Changes</button>
                </div>
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <div class="text-blue-100 font-medium">Total Semesters</div>
                <div class="text-4xl font-bold mt-2">${data.semesters.length}</div>
            </div>
            <div class="card bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
                <div class="text-teal-100 font-medium">Last GPA</div>
                <div class="text-4xl font-bold mt-2">${data.semesters.length > 0 ? data.semesters[data.semesters.length - 1].sgpa : 'N/A'}</div>
            </div>
             <div class="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
                <div class="text-indigo-100 font-medium">Total Subjects</div>
                <div class="text-4xl font-bold mt-2">${data.semesters.reduce((acc, sem) => acc + sem.subjects.length, 0)}</div>
            </div>
        </div>

        <div id="goal-calc-container"></div>

        <!-- Recent Activity / Motivational Message -->
        <div class="mt-8">
             ${getPerformanceFeedback(data)}
        </div>
    `;

    setupGoalCalculator(document.querySelector('#goal-calc-container'));
    setupProfileModal(element);
    setupProfileSwitcher(element);
}

function setupProfileSwitcher(element) {
    const switcher = document.getElementById('profile-switcher');
    const addBtn = document.getElementById('add-profile-btn');
    const deleteBtn = document.getElementById('delete-profile-btn');

    switcher.addEventListener('change', (e) => {
        DataModel.switchProfile(e.target.value);
        // Full Page Reload to ensure all components see new data (simplest approach for now)
        window.location.reload();
    });

    addBtn.addEventListener('click', () => {
        const name = prompt("Enter new profile name (e.g. 'John's Record'):");
        if (name) {
            DataModel.createProfile(name);
            window.location.reload();
        }
    });

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete this profile? This cannot be undone.")) {
                const active = DataModel.getActiveProfile();
                DataModel.deleteProfile(active.id);
                window.location.reload();
            }
        });
    }
}

function setupProfileModal(element) {
    const modal = document.getElementById('edit-profile-modal');
    const editBtn = document.getElementById('edit-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const saveBtn = document.getElementById('save-profile-btn');

    editBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    saveBtn.addEventListener('click', () => {
        const name = document.getElementById('edit-name').value;
        const rollNo = document.getElementById('edit-roll').value;
        const major = document.getElementById('edit-major').value;

        if (name && rollNo && major) {
            DataModel.updateStudent({ name, rollNo, major });
            modal.classList.add('hidden');
            setupDashboard(element); // Re-render
            // Update switcher name if changed
            window.location.reload();
        } else {
            alert("All fields are required.");
        }
    });
}

function getPerformanceFeedback(data) {
    if (data.semesters.length < 2) return '';
    const last = parseFloat(data.semesters[data.semesters.length - 1].sgpa);
    const prev = parseFloat(data.semesters[data.semesters.length - 2].sgpa);

    if (last > prev) {
        return `
            <div class="p-4 bg-green-100 text-green-800 rounded-lg flex items-center">
                <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                <span><strong>Growth Detected!</strong> Your performance is improving. Keep it up!</span>
            </div>
        `;
    } else if (last < prev) {
        return `
            <div class="p-4 bg-orange-100 text-orange-800 rounded-lg flex items-center">
                <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                <span><strong>Performance Alert:</strong> Your GPA dipped slightly. Review your weak areas.</span>
            </div>
        `;
    }
    return '';
}
