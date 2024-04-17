const fs = require('fs');

class DataFiles {
    constructor() {
        this.source = null;
        this.destination = null;
        this.filename = null;
    }

    setSource(source) { this.source = source; }
    getSource() { return this.source; }

    setDestination(destination) { this.destination = destination; }
    getDestination() { return this.destination; }
    
    countFiles() {   
        try {
            const files = fs.readdirSync(this.source);            
            return files.length;
        } catch(e) {
            console.error(`Error reading source folder:`, e);
            return 0;
        }
    }

    listFiles() {
        try {
            const files = fs.readdirSync(this.source);  
            return files;
        } catch(e) {
            console.error(`Error reading source folder:`, e);
            return [];
        }
    }

    moveFile() {
        try {
            fs.renameSync(`${this.source}/${this.filename}`, `${this.destination}/${this.filename}`);
        } catch(e) {
            console.error(`Error reading source folder:`, e);
            return false;
        }
    }

    copyFile(source, destination) {
        fs.copyFile(source, destination, (err) => {
            if (err) {
                console.error('Error processing file:', err);
                return;
            }
        });
    }
}

module.exports = { DataFiles }