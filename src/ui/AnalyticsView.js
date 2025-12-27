import Chart from 'chart.js/auto';
import { DataModel } from '../logic/DataModel.js';
import { Calculator } from '../logic/Calculator.js';
// Import navigateTo to redirect users
import { navigateTo } from './Navigation.js';

export function setupAnalytics(element) {
    const data = DataModel.getData();

    element.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Analytics</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- GPA Trend Chart -->
            <div class="card">
                <h3 class="text-lg font-bold mb-4 text-gray-700">GPA Trend</h3>
                <div class="relative h-64 w-full">
                    <canvas id="gpa-chart"></canvas>
                </div>
            </div>

            <!-- Semester Summary Table -->
            <div class="card">
                 <h3 class="text-lg font-bold mb-4 text-gray-700">Semester Summary</h3>
                 <div class="overflow-x-auto">
                    <table class="min-w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-4 py-2">Semester</th>
                                <th class="px-4 py-2">Credits</th>
                                <th class="px-4 py-2">SGPA</th>
                                <th class="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.semesters.map((sem, index) => `
                                <tr class="bg-white border-b hover:bg-gray-50 group">
                                    <td class="px-4 py-2 font-medium text-gray-900">${sem.name}</td>
                                    <td class="px-4 py-2">${sem.subjects ? sem.subjects.reduce((sum, sub) => sum + parseFloat(sub.credits), 0) : 0}</td>
                                    <td class="px-4 py-2 font-bold text-primary">${sem.sgpa}</td>
                                    <td class="px-4 py-2 text-right space-x-2">
                                        <button class="view-sem-btn text-blue-500 hover:text-blue-700" data-index="${index}" title="View Details">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button class="edit-sem-btn text-yellow-500 hover:text-yellow-700" data-index="${index}" title="Edit Semester">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button class="delete-sem-btn text-red-300 hover:text-red-500 hover:bg-red-50 rounded p-1 transition" data-index="${index}" title="Delete Semester">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${data.semesters.length === 0 ? '<p class="text-center p-4 text-gray-400">No semesters added yet.</p>' : ''}
                 </div>
            </div>
        </div>

        <!-- Semester Details Modal -->
        <div id="sem-details-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">
                <div class="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 class="text-xl font-bold text-gray-800" id="modal-sem-name">Semester Details</h3>
                    <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto" id="modal-content">
                    <!-- Dynamic Content -->
                </div>
                <div class="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
                    <button id="modal-ok-btn" class="btn btn-primary">Close</button>
                </div>
            </div>
        </div>
    `;

    // Chart
    if (data.semesters.length > 0) {
        renderChart(data);
    } else {
        const chartContainer = document.getElementById('gpa-chart');
        if (chartContainer) {
            chartContainer.parentElement.innerHTML = '<p class="text-center text-gray-500 flex items-center justify-center h-full">No data available. Add a semester to see trends.</p>';
        }
    }

    // Modal Logic
    const modal = document.getElementById('sem-details-modal');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-sem-name');

    document.querySelectorAll('.view-sem-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            const semester = data.semesters[index];

            modalTitle.textContent = `${semester.name} Details`;
            modalContent.innerHTML = '<div class="text-center py-8 text-gray-500">Loading details from backend...</div>';
            modal.classList.remove('hidden');

            if (!semester.subjects || semester.subjects.length === 0) {
                modalContent.innerHTML = '<p class="text-center text-gray-500">No subjects recorded.</p>';
                return;
            }

            // Async load eligibilities
            const eligibilities = await Promise.all(semester.subjects.map(sub =>
                Calculator.calculateCIEEligibility(sub.cie1, sub.cie2, sub.cie3)
            ));

            modalContent.innerHTML = renderSemesterDetails(semester, eligibilities);
        });
    });

    const closeModal = () => modal.classList.add('hidden');
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('modal-ok-btn').addEventListener('click', closeModal);

    // Edit Logic
    document.querySelectorAll('.edit-sem-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            navigateTo('add-marks', { editIndex: index });
        });
    });

    // Attach Delete Events
    document.querySelectorAll('.delete-sem-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            if (confirm('Are you sure you want to delete this semester? This action cannot be undone.')) {
                await DataModel.deleteSemester(index);
                setupAnalytics(element); // Re-render this view
            }
        });
    });
}

function renderSemesterDetails(semester, eligibilities) {
    if (!semester.subjects || semester.subjects.length === 0) {
        return '<p class="text-center text-gray-500">No subjects recorded.</p>';
    }

    return `
        <div class="space-y-4">
            ${semester.subjects.map((sub, idx) => {
        const eligibility = eligibilities[idx];

        return `
                <div class="border rounded-lg p-4 hover:shadow-sm transition">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-bold text-gray-800">${sub.name}</h4>
                            <span class="text-xs text-gray-500">${sub.credits} Credits • Grade: ${sub.gradePoint}</span>
                        </div>
                        <div class="text-right">
                             ${eligibility.eligible === true
                ? '<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">Eligible</span>'
                : eligibility.eligible === false
                    ? '<span class="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">Not Eligible</span>'
                    : '<span class="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded">Pending</span>'
            }
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded text-sm mb-2">
                        <div class="flex space-x-4 mb-2">
                            <div class="flex flex-col">
                                <span class="text-xs text-gray-500">CIE 1</span>
                                <span class="font-medium">${sub.cie1 || '-'}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-xs text-gray-500">CIE 2</span>
                                <span class="font-medium">${sub.cie2 || '-'}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-xs text-gray-500">CIE 3</span>
                                <span class="font-medium">${sub.cie3 || '-'}</span>
                            </div>
                             <div class="flex flex-col border-l pl-4">
                                <span class="text-xs text-gray-500">Total</span>
                                <span class="font-medium">${(sub.cie1 || 0) + (sub.cie2 || 0) + (sub.cie3 || 0)} / 90</span>
                            </div>
                        </div>
                        <div class="text-xs ${eligibility.eligible === true ? 'text-green-600' : 'text-orange-600'}">
                            ${eligibility.message}
                        </div>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    `;
}

function renderChart(data) {
    const ctx = document.getElementById('gpa-chart');
    if (!ctx) return;

    const semesterLabels = data.semesters.map(s => s.name);
    const sgpaData = data.semesters.map(s => s.sgpa);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: semesterLabels,
            datasets: [{
                label: 'SGPA',
                data: sgpaData,
                borderColor: '#1a237e',
                backgroundColor: 'rgba(26, 35, 126, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#009688',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: { color: '#f3f4f6' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
