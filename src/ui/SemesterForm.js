import { DataModel } from '../logic/DataModel.js';
import { setupDashboard } from './Dashboard.js';
import { Calculator } from '../logic/Calculator.js';
// Import navigateTo if we want to go back to analytics/dashboard
import { navigateTo } from './Navigation.js';

export function setupSemesterForm(element, params = {}) {
    // Check if we are in Edit Mode
    const isEditMode = params.editIndex !== undefined;
    const editIndex = params.editIndex;
    let existingData = null;

    if (isEditMode) {
        existingData = DataModel.getSemester(editIndex);
    }

    element.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">${isEditMode ? 'Edit Semester' : 'Add Semester'}</h2>
        
        <div class="card max-w-4xl bg-white p-6 rounded-lg shadow-md">
            <!-- Semester Info -->
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Semester Name</label>
                <input type="text" id="semester-name" class="input-field w-full border border-gray-300 rounded-md p-2" 
                    placeholder="e.g. Fall 2024 or Semester 1"
                    value="${isEditMode ? existingData.name : ''}">
            </div>

            <!-- Subjects Container -->
            <div id="subjects-container" class="space-y-6 mb-6">
                <!-- Dynamic subject rows will appear here -->
            </div>

            <button id="add-subject-btn" class="text-accent font-semibold flex items-center mb-6 hover:text-teal-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                Add Subject
            </button>

            <div class="flex justify-end space-x-3">
                <button id="cancel-btn" class="btn text-gray-600 hover:bg-gray-100">Cancel</button>
                <button id="save-semester-btn" class="btn btn-primary">${isEditMode ? 'Update Semester' : 'Save Semester'}</button>
            </div>
        </div>
    `;

    const subjectsContainer = document.getElementById('subjects-container');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const saveBtn = document.getElementById('save-semester-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Pre-fill subjects if editing, else add one empty row
    if (isEditMode && existingData.subjects.length > 0) {
        existingData.subjects.forEach(sub => addSubjectRow(sub));
    } else {
        addSubjectRow();
    }

    addSubjectBtn.addEventListener('click', () => addSubjectRow());

    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('semester-name').value;
        const subjectRows = document.querySelectorAll('.subject-row');
        const subjects = [];

        if (!name.trim()) {
            alert('Please enter a semester name');
            return;
        }

        subjectRows.forEach(row => {
            const subName = row.querySelector('.sub-name').value;
            const subCredits = row.querySelector('.sub-credits').value;
            const subGrade = row.querySelector('.sub-grade').value;

            // CIE Inputs
            const cie1 = row.querySelector('.cie-1').value;
            const cie2 = row.querySelector('.cie-2').value;
            const cie3 = row.querySelector('.cie-3').value;

            if (subName && subCredits && subGrade) {
                subjects.push({
                    name: subName,
                    credits: parseFloat(subCredits),
                    gradePoint: parseFloat(subGrade),
                    cie1: cie1 ? parseFloat(cie1) : null,
                    cie2: cie2 ? parseFloat(cie2) : null,
                    cie3: cie3 ? parseFloat(cie3) : null
                });
            }
        });

        if (subjects.length === 0) {
            alert('Please add at least one subject with valid details');
            return;
        }

        // Show loading state on button
        const originalText = saveBtn.innerText;
        saveBtn.innerText = "Saving...";
        saveBtn.disabled = true;

        try {
            if (isEditMode) {
                await DataModel.updateSemester(editIndex, { name, subjects });
                alert('Semester updated successfully!');
                navigateTo('analytics');
            } else {
                await DataModel.addSemester({ name, subjects });
                alert('Semester saved successfully!');
                navigateTo('dashboard');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving semester: ' + error.message);
            saveBtn.innerText = originalText;
            saveBtn.disabled = false;
        }
    });

    cancelBtn.addEventListener('click', () => {
        navigateTo('dashboard');
    });

    function addSubjectRow(data = null) {
        const div = document.createElement('div');
        div.className = 'subject-row p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition bg-gray-50';

        // Helper to safely get value
        const val = (prop) => data ? (data[prop] !== null && data[prop] !== undefined ? data[prop] : '') : '';

        div.innerHTML = `
            <div class="flex flex-wrap md:flex-nowrap gap-4 mb-4">
                <div class="flex-grow">
                    <label class="block text-xs text-gray-500 mb-1">Subject Name</label>
                    <input type="text" class="sub-name input-field w-full h-10 px-3 border border-gray-300 rounded-md" placeholder="Maths" value="${val('name')}">
                </div>
                <div class="w-24">
                    <label class="block text-xs text-gray-500 mb-1">Credits</label>
                    <input type="number" step="0.5" class="sub-credits input-field w-full h-10 px-3 border border-gray-300 rounded-md" placeholder="3" value="${val('credits')}">
                </div>
                <div class="w-32">
                    <label class="block text-xs text-gray-500 mb-1">Grade Point</label>
                     <select class="sub-grade input-field w-full h-10 px-3 border border-gray-300 rounded-md">
                        <option value="" disabled ${!data ? 'selected' : ''}>Select</option>
                        <option value="10" ${val('gradePoint') == 10 ? 'selected' : ''}>O (10)</option>
                        <option value="9" ${val('gradePoint') == 9 ? 'selected' : ''}>A+ (9)</option>
                        <option value="8" ${val('gradePoint') == 8 ? 'selected' : ''}>A (8)</option>
                        <option value="7" ${val('gradePoint') == 7 ? 'selected' : ''}>B+ (7)</option>
                        <option value="6" ${val('gradePoint') == 6 ? 'selected' : ''}>B (6)</option>
                        <option value="5" ${val('gradePoint') == 5 ? 'selected' : ''}>C (5)</option>
                        <option value="0" ${val('gradePoint') == 0 ? 'selected' : ''}>F (0)</option>
                     </select>
                </div>
                <div class="flex items-end pb-1">
                    <button class="remove-subject-btn text-red-500 hover:text-red-700 bg-white p-2 rounded border border-gray-200 hover:border-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- CIE Section -->
            <div class="bg-white p-3 rounded border border-dashed border-gray-300">
                <div class="text-xs font-bold text-gray-500 uppercase mb-2">Internal Assessment (CIE) - Max 30</div>
                <div class="flex flex-wrap items-center gap-4">
                    <div class="w-20">
                        <input type="number" class="cie-input cie-1 input-field w-full text-sm border-gray-300 rounded p-1" placeholder="CIE 1" max="30" value="${val('cie1')}">
                    </div>
                    <div class="w-20">
                        <input type="number" class="cie-input cie-2 input-field w-full text-sm border-gray-300 rounded p-1" placeholder="CIE 2" max="30" value="${val('cie2')}">
                    </div>
                    <div class="w-20">
                        <input type="number" class="cie-input cie-3 input-field w-full text-sm border-gray-300 rounded p-1" placeholder="CIE 3" max="30" value="${val('cie3')}">
                    </div>
                    
                    <div class="flex-grow text-xs md:text-sm">
                        <span class="cie-status text-gray-400 italic">Enter CIE marks to see eligibility...</span>
                    </div>
                </div>
            </div>
        `;

        div.querySelector('.remove-subject-btn').addEventListener('click', () => {
            div.remove();
        });

        // Add listeners for CIE calculation
        const inputs = div.querySelectorAll('.cie-input');
        const statusSpan = div.querySelector('.cie-status');
        let debounceTimer;

        const updateStatus = async () => {
            const c1 = div.querySelector('.cie-1').value;
            const c2 = div.querySelector('.cie-2').value;
            const c3 = div.querySelector('.cie-3').value;

            if (c1 || c2 || c3) {
                statusSpan.textContent = "Checking...";
                statusSpan.className = 'cie-status text-gray-400 italic';

                try {
                    const result = await Calculator.calculateCIEEligibility(c1, c2, c3);
                    statusSpan.innerHTML = result.message;
                    statusSpan.className = 'cie-status text-xs md:text-sm font-medium ' +
                        (result.eligible === true ? 'text-green-600' :
                            result.eligible === false ? 'text-red-600' : 'text-orange-600');
                } catch (e) {
                    statusSpan.textContent = "Server busy...";
                }
            } else {
                statusSpan.textContent = "Enter CIE marks to see eligibility...";
                statusSpan.className = 'cie-status text-gray-400 italic';
            }
        };

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(updateStatus, 500);
            });
        });

        // Initial Calculation if data exists
        if (data) updateStatus();

        subjectsContainer.appendChild(div);
    }
}
