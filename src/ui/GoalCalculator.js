import { DataModel } from '../logic/DataModel.js';
import { Calculator } from '../logic/Calculator.js';

export function setupGoalCalculator(container) {
    container.innerHTML = `
        <div class="card mt-8">
            <h3 class="text-xl font-bold mb-4">Goal Calculator</h3>
            <p class="text-gray-600 mb-4">Set a target CGPA and find out what GPA you need in upcoming semesters.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Target CGPA</label>
                    <input type="number" id="target-cgpa" step="0.01" min="0" max="10" class="input-field" placeholder="e.g., 9.0">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Semesters Remaining</label>
                    <input type="number" id="semesters-remaining" min="1" max="10" class="input-field" placeholder="e.g., 2">
                </div>
            </div>
            
            <button id="calc-goal-btn" class="btn btn-primary w-full md:w-auto">Calculate Required GPA</button>
            
            <div id="goal-result" class="mt-4 hidden p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200"></div>
        </div>
    `;

    document.getElementById('calc-goal-btn').addEventListener('click', () => {
        const targetCGPA = parseFloat(document.getElementById('target-cgpa').value);
        const remaining = parseInt(document.getElementById('semesters-remaining').value);
        const data = DataModel.getData();
        const currentCGPA = parseFloat(data.student.cgpa) || 0;
        const currentSemesters = data.semesters.length;

        if (!targetCGPA || !remaining) {
            alert('Please enter valid inputs');
            return;
        }

        // Logic assume each semester has equal weight for simplicity or average credits
        // (Target * TotalSems) - (Current * CurrentSems) / Remaining
        const totalSemesters = currentSemesters + remaining;
        const requiredTotalPoints = targetCGPA * totalSemesters;
        const currentPoints = currentCGPA * currentSemesters;
        const requiredRemainingPoints = requiredTotalPoints - currentPoints;
        const requiredGPA = (requiredRemainingPoints / remaining).toFixed(2);

        const resultDiv = document.getElementById('goal-result');
        resultDiv.classList.remove('hidden');

        if (requiredGPA > 10) {
            resultDiv.innerHTML = `<strong>Impossible!</strong> You would need a GPA of <strong>${requiredGPA}</strong>, which is above 10.`;
            resultDiv.classList.replace('bg-blue-50', 'bg-red-50');
            resultDiv.classList.replace('text-blue-800', 'text-red-800');
            resultDiv.classList.replace('border-blue-200', 'border-red-200');
        } else if (requiredGPA < 0) {
            resultDiv.innerHTML = `<strong>Great news!</strong> You're already above your target.`;
            resultDiv.classList.replace('bg-blue-50', 'bg-green-50');
            resultDiv.classList.replace('text-blue-800', 'text-green-800');
            resultDiv.classList.replace('border-blue-200', 'border-green-200');
        } else {
            resultDiv.innerHTML = `You need to average a GPA of <strong>${requiredGPA}</strong> in your next ${remaining} semester(s).`;
            resultDiv.className = 'mt-4 p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200'; // Reset classes
        }
    });
}
