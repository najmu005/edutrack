const DB_KEY = 'edutrack_data';

export const Storage = {
    get() {
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : null;
    },

    save(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    },

    init() {
        // Migration Logic: Convert old single-user schema to multi-profile schema
        const raw = this.get();

        // Initial setup if empty
        if (!raw) {
            this.save({
                activeProfileId: 'default',
                profiles: [this.createProfile('Default Profile', 'default')]
            });
            return;
        }

        // Migrate if it's the old schema (has direct 'student' property)
        if (raw.student) {
            console.log("Migrating to multi-profile schema...");
            const newSchema = {
                activeProfileId: 'default',
                profiles: [{
                    id: 'default',
                    name: raw.student.name || 'Default Profile',
                    data: raw // The entire old object becomes the data for this profile
                }]
            };
            this.save(newSchema);
        }
    },

    createProfile(name, id) {
        return {
            id: id || Date.now().toString(),
            name: name,
            data: {
                student: {
                    name: 'Student Name',
                    rollNo: '',
                    major: '',
                    cgpa: 0.0
                },
                semesters: [],
                attendance: []
            }
        };
    }
};
