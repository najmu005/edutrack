import { Storage } from './Storage.js';
import { Calculator } from './Calculator.js';

export const DataModel = {
    // --- Profile Management ---

    getGlobalState() {
        Storage.init();
        return Storage.get();
    },

    saveGlobalState(state) {
        Storage.save(state);
    },

    getActiveProfile() {
        const state = this.getGlobalState();
        return state.profiles.find(p => p.id === state.activeProfileId);
    },

    getAllProfiles() {
        const state = this.getGlobalState();
        return state.profiles.map(p => ({ id: p.id, name: p.name }));
    },

    createProfile(name) {
        const state = this.getGlobalState();
        const newProfile = Storage.createProfile(name);
        state.profiles.push(newProfile);
        state.activeProfileId = newProfile.id; // Auto-switch
        this.saveGlobalState(state);
        return newProfile;
    },

    switchProfile(id) {
        const state = this.getGlobalState();
        if (state.profiles.find(p => p.id === id)) {
            state.activeProfileId = id;
            this.saveGlobalState(state);
            return true;
        }
        return false;
    },

    deleteProfile(id) {
        const state = this.getGlobalState();
        if (state.profiles.length <= 1) return false; // Prevent deleting last profile

        state.profiles = state.profiles.filter(p => p.id !== id);
        if (state.activeProfileId === id) {
            state.activeProfileId = state.profiles[0].id; // Switch to another
        }
        this.saveGlobalState(state);
        return true;
    },

    // --- Data Access (Operates on Active Profile) ---

    getData() {
        const profile = this.getActiveProfile();
        if (!profile.data.attendance) {
            profile.data.attendance = [];
            this.saveData(profile.data);
        }
        return profile.data;
    },

    saveData(newData) {
        const state = this.getGlobalState();
        const profileIndex = state.profiles.findIndex(p => p.id === state.activeProfileId);
        if (profileIndex !== -1) {
            state.profiles[profileIndex].data = newData;
            state.profiles[profileIndex].name = newData.student.name; // Sync profile name
            this.saveGlobalState(state);
        }
    },

    // --- Student & Semester Logic (Proxies to Active Profile) ---

    updateStudent(studentData) {
        const data = this.getData();
        data.student = { ...data.student, ...studentData };
        this.saveData(data);
        return data.student;
    },

    async addSemester(semesterData) {
        const data = this.getData();
        semesterData.sgpa = await Calculator.calculateSGPA(semesterData.subjects);
        data.semesters.push(semesterData);
        data.student.cgpa = await Calculator.calculateCGPA(data.semesters);
        this.saveData(data);
        return data;
    },

    async deleteSemester(index) {
        const data = this.getData();
        data.semesters.splice(index, 1);
        data.student.cgpa = await Calculator.calculateCGPA(data.semesters);
        this.saveData(data);
        return data;
    },

    getSemester(index) {
        const data = this.getData();
        return data.semesters[index];
    },

    async updateSemester(index, updatedSemester) {
        const data = this.getData();
        updatedSemester.sgpa = await Calculator.calculateSGPA(updatedSemester.subjects);
        data.semesters[index] = updatedSemester;
        data.student.cgpa = await Calculator.calculateCGPA(data.semesters);
        this.saveData(data);
        return data;
    },

    // --- Attendance Logic (Proxies) ---

    addAttendanceSubject(subject) {
        const data = this.getData();
        data.attendance.push(subject);
        this.saveData(data);
        return data.attendance;
    },

    updateAttendanceSubject(index, updatedSubject) {
        const data = this.getData();
        data.attendance[index] = updatedSubject;
        this.saveData(data);
        return data.attendance;
    },

    deleteAttendanceSubject(index) {
        const data = this.getData();
        data.attendance.splice(index, 1);
        this.saveData(data);
        return data.attendance;
    }
};
