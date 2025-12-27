import { DataModel } from '../logic/DataModel.js';
import { Calculator } from '../logic/Calculator.js';

export async function setupAttendanceView(element) {
    const data = DataModel.getData();
    const attendanceSubjects = Array.isArray(data.attendance) ? data.attendance : [];

    // Pre-fetch all statuses asynchronously from C++ backend
    const statuses = await Promise.all(attendanceSubjects.map(sub =>
        Calculator.calculateAttendanceStatus(sub.totalCourse || 0, sub.conducted, sub.attended)
    ));

    element.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 class="text-3xl font-bold">Attendance Tracker</h2>
            <div class="flex space-x-2 mt-4 md:mt-0">
                <button id="import-subjects-btn" class="btn bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                    Import Subjects
                </button>
                <button id="add-attendance-btn" class="btn btn-primary flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Add Subject
                </button>
            </div>
        </div>

        <!-- Cards Grid -->
        <div id="attendance-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${renderAttendanceCards(attendanceSubjects, statuses)}
        </div>

        ${attendanceSubjects.length === 0 ? '<div class="text-center text-gray-500 mt-10">No subjects tracked yet. Add or import one to get started!</div>' : ''}

        <!-- Add Subject Modal -->
        <div id="add-attendance-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white p-6 rounded-lg w-full max-w-md shadow-xl animate-fade-in-up">
                <h3 class="text-xl font-bold mb-4">Track New Subject</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Subject Name</label>
                        <input type="text" id="att-sub-name" class="input-field mt-1">
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                             <label class="block text-xs font-medium text-gray-700">Total Classes</label>
                             <input type="number" id="att-total-course" class="input-field mt-1" value="40">
                        </div>
                        <div>
                             <label class="block text-xs font-medium text-gray-700">Conducted</label>
                             <input type="number" id="att-conducted" class="input-field mt-1" value="0">
                        </div>
                        <div>
                             <label class="block text-xs font-medium text-gray-700">Attended</label>
                             <input type="number" id="att-attended" class="input-field mt-1" value="0">
                        </div>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button id="cancel-att-btn" class="btn text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button id="save-att-btn" class="btn btn-primary">Start Tracking</button>
                </div>
            </div>
        </div>
        
        <!-- Import Modal -->
        <div id="import-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white p-6 rounded-lg w-full max-w-md shadow-xl animate-fade-in-up">
                <h3 class="text-xl font-bold mb-4">Import from Semesters</h3>
                <div id="import-list">
                    <!-- Wizard Content -->
                </div>
                <div class="flex justify-end space-x-3 mt-4">
                    <button id="cancel-import-btn" class="btn text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button id="confirm-import-btn" class="btn btn-primary">Next</button>
                </div>
            </div>
        </div>
    `;

    setupModalLogic(element);
    setupImportLogic(element, data);
    setupCardActions(element, attendanceSubjects);
}

function renderAttendanceCards(subjects, statuses) {
    return subjects.map((sub, index) => {
        const status = statuses[index]; // Use pre-calculated status
        const percentage = parseFloat(status.percentage);

        // Color coding
        let colorClass = 'text-green-600';
        let barColor = 'bg-green-500';
        if (percentage < 75) { // Warning zone
            colorClass = 'text-red-600';
            barColor = 'bg-red-500';
        } else if (percentage < 85) { // Caution zone
            colorClass = 'text-orange-500';
            barColor = 'bg-orange-400';
        }

        const total = parseInt(sub.totalCourse) || 0;
        const conducted = parseInt(sub.conducted) || 0;
        const isCourseComplete = (total > 0) && (conducted >= total);

        return `
        <div class="card relative group">
            <button class="delete-att-btn absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" data-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            
            <h3 class="font-bold text-lg mb-1 truncate" title="${sub.name}">${sub.name}</h3>
            
            <div class="flex items-end justify-between mb-2">
                <span class="text-4xl font-bold ${colorClass}">${status.percentage}%</span>
                <span class="text-xs text-gray-500 mb-1">Target: 85%</span>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div class="${barColor} h-2.5 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
            </div>

            <div class="grid grid-cols-4 gap-1 text-center text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                 <div>
                    <div class="font-bold">${sub.totalCourse || '-'}</div>
                    <div class="text-[10px] uppercase">Total</div>
                </div>
                 <div>
                    <div class="font-bold">${sub.conducted}</div>
                    <div class="text-[10px] uppercase">Held</div>
                </div>
                 <div>
                    <div class="font-bold">${sub.attended}</div>
                    <div class="text-[10px] uppercase">Present</div>
                </div>
                 <div>
                    <div class="font-bold">${(sub.totalCourse || sub.conducted) - sub.conducted}</div>
                    <div class="text-[10px] uppercase">Rem.</div>
                </div>
                 <div class="col-span-4 border-t mt-1 pt-1 flex justify-between px-2">
                    <span>Missed: <strong class="text-red-500">${sub.conducted - sub.attended}</strong></span>
                    <span>Pending: <strong>${(sub.totalCourse || sub.conducted) - sub.conducted}</strong></span>
                 </div>
            </div>
            
            <div class="text-xs mb-4 text-gray-700 min-h-[2.5em] flex items-center bg-blue-50 p-2 rounded border border-blue-100">
                ${isCourseComplete ? '<strong>Course Complete</strong>' : status.message}
            </div>

            <div class="flex space-x-2">
                <button class="btn btn-outline-danger flex-1 py-1 text-sm flex justify-center items-center update-att-btn" 
                    data-index="${index}" data-type="absent" ${isCourseComplete ? 'disabled' : ''}>
                    + Absent
                </button>
                <button class="btn btn-outline-success flex-1 py-1 text-sm flex justify-center items-center update-att-btn" 
                    data-index="${index}" data-type="present" ${isCourseComplete ? 'disabled' : ''}>
                    + Present
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function setupModalLogic(element) {
    const modal = document.getElementById('add-attendance-modal');
    const addBtn = document.getElementById('add-attendance-btn');
    const cancelBtn = document.getElementById('cancel-att-btn');
    const saveBtn = document.getElementById('save-att-btn');

    addBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    saveBtn.addEventListener('click', () => {
        const name = document.getElementById('att-sub-name').value;
        const total = parseInt(document.getElementById('att-total-course').value) || 0;
        const conducted = parseInt(document.getElementById('att-conducted').value) || 0;
        const attended = parseInt(document.getElementById('att-attended').value) || 0;

        if (name) {
            DataModel.addAttendanceSubject({ name, totalCourse: total, conducted, attended });
            modal.classList.add('hidden');
            setupAttendanceView(element);
        } else {
            alert("Subject name is required.");
        }
    });
}

function setupImportLogic(element, data) {
    const modal = document.getElementById('import-modal');
    const openBtn = document.getElementById('import-subjects-btn');
    const closeBtn = document.getElementById('cancel-import-btn');
    const confirmBtn = document.getElementById('confirm-import-btn');
    const listContainer = document.getElementById('import-list');
    const title = modal.querySelector('h3');

    let step = 1;
    let selectedSubjects = [];

    const renderStep1 = () => {
        step = 1;
        title.innerText = "Import from Semesters";
        confirmBtn.innerText = "Next: Add Details";
        listContainer.className = "mb-4 max-h-60 overflow-y-auto border p-2 rounded";

        const subjects = new Set();
        data.semesters.forEach(sem => {
            sem.subjects.forEach(sub => subjects.add(sub.name));
        });

        const existing = new Set(data.attendance?.map(s => s.name) || []);
        const toImport = [...subjects].filter(s => !existing.has(s));

        if (toImport.length === 0) {
            listContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No new subjects found to import.</div>';
            confirmBtn.disabled = true;
            return;
        }

        confirmBtn.disabled = false;
        listContainer.innerHTML = toImport.map(name => `
            <div class="flex items-center p-2 hover:bg-gray-50">
                <input type="checkbox" value="${name}" class="import-checkbox mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                <label class="text-sm text-gray-700 font-medium">${name}</label>
            </div>
        `).join('');
    };

    const renderStep2 = () => {
        step = 2;
        title.innerText = "Configure Attendance Details";
        confirmBtn.innerText = "Confirm Import";
        listContainer.className = "mb-4 max-h-[60vh] overflow-y-auto";

        listContainer.innerHTML = selectedSubjects.map((name, idx) => `
            <div class="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm subject-config-row" data-name="${name}">
                <h4 class="font-bold text-gray-800 mb-3 border-b pb-2">${name}</h4>
                
                <div class="grid grid-cols-3 gap-3 mb-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Total Classes</label>
                        <input type="number" class="input-field w-full text-sm p-1 inp-total" value="40" min="1">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Held (Conducted)</label>
                        <input type="number" class="input-field w-full text-sm p-1 inp-conducted" value="0" min="0">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Missed (Bunks)</label>
                        <input type="number" class="input-field w-full text-sm p-1 inp-missed" value="0" min="0">
                    </div>
                </div>

                <div class="text-xs bg-white p-2 rounded border border-gray-200">
                    <div class="flex justify-between mb-1">
                        <span>Attended (Calc): <strong class="val-attended">0</strong></span>
                        <span class="val-percentage font-bold text-gray-400">0%</span>
                    </div>
                    <div class="val-message text-gray-500 italic">Enter details to see status...</div>
                </div>
            </div>
        `).join('');

        listContainer.querySelectorAll('.subject-config-row').forEach(row => {
            const inpTotal = row.querySelector('.inp-total');
            const inpConducted = row.querySelector('.inp-conducted');
            const inpMissed = row.querySelector('.inp-missed');

            const valAttended = row.querySelector('.val-attended');
            const valPercentage = row.querySelector('.val-percentage');
            const valMessage = row.querySelector('.val-message');

            const updateCalc = async () => {
                const total = parseInt(inpTotal.value) || 0;
                const conducted = parseInt(inpConducted.value) || 0;
                const missed = parseInt(inpMissed.value) || 0;
                const attended = Math.max(0, conducted - missed);

                valAttended.textContent = attended;

                // Async calculation
                valPercentage.textContent = '...';
                valMessage.textContent = 'Calculating...';

                const status = await Calculator.calculateAttendanceStatus(total, conducted, attended);

                valPercentage.textContent = status.percentage + '%';
                valPercentage.className = 'val-percentage font-bold ' +
                    (parseFloat(status.percentage) >= 85 ? 'text-green-600' : 'text-red-500');

                valMessage.innerHTML = status.message;
            };

            inpTotal.addEventListener('input', updateCalc);
            inpConducted.addEventListener('input', updateCalc);
            inpMissed.addEventListener('input', updateCalc);

            // Trigger once
            updateCalc();
        });
    };

    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        renderStep1();
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    confirmBtn.addEventListener('click', () => {
        if (step === 1) {
            const checkboxes = listContainer.querySelectorAll('.import-checkbox:checked');
            if (checkboxes.length === 0) {
                alert("Please select at least one subject.");
                return;
            }
            selectedSubjects = Array.from(checkboxes).map(cb => cb.value);
            renderStep2();
        } else {
            const configs = listContainer.querySelectorAll('.subject-config-row');
            configs.forEach(row => {
                const name = row.getAttribute('data-name');
                const total = parseInt(row.querySelector('.inp-total').value) || 40;
                const conducted = parseInt(row.querySelector('.inp-conducted').value) || 0;
                const missed = parseInt(row.querySelector('.inp-missed').value) || 0;
                const attended = Math.max(0, conducted - missed);

                DataModel.addAttendanceSubject({
                    name,
                    totalCourse: total,
                    conducted,
                    attended
                });
            });

            modal.classList.add('hidden');
            setupAttendanceView(element);
        }
    });
}

function setupCardActions(element, subjects) {
    document.querySelectorAll('.delete-att-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = btn.getAttribute('data-index');
            if (confirm("Stop tracking this subject?")) {
                DataModel.deleteAttendanceSubject(index);
                setupAttendanceView(element);
            }
        });
    });

    document.querySelectorAll('.update-att-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = btn.getAttribute('data-index');
            const type = btn.getAttribute('data-type');
            const subject = subjects[index];
            const updates = {
                conducted: subject.conducted + 1,
                attended: subject.attended + (type === 'present' ? 1 : 0)
            };
            DataModel.updateAttendanceSubject(index, updates);
            setupAttendanceView(element);
        });
    });
}
