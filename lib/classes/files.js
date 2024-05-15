const fs = require('fs');
const path = require('path');

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

    checkFileExist(filePath) {
        return new Promise((resolve, reject) => {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    // File does not exist
                    resolve(false);
                } else {
                    // File exists
                    resolve(true);
                }
            });
        });
    }

    deleteFile(source) {
        fs.unlinkSync(source, (err) => {
            if (err) {
                console.error('Error processing file:', err);
                return;
            }
        });
    }

    renameFile(filePath, filename, cuttOff=null) {
        let timeSet = new Date().toLocaleString(undefined, {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}).split(":");
        timeSet = `${timeSet[0]}${timeSet[1]}${timeSet[2]}`

        let currentDate = new Date().toLocaleDateString(undefined, {year: "numeric", day: "numeric", month: "numeric"}).split("/");
        currentDate = `${currentDate[0]}_${currentDate[1]}_${currentDate[2]}`;
        
        const extension = path.extname(filename);
        const baseFilename = path.basename(filename, extension);
        const newFilename = `${filePath}/${process.env.PROCESSED}/${baseFilename}_${currentDate}_${timeSet}${extension}`;

        fs.renameSync(filename, newFilename);
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (err) {
            return false;
        }
    }
}

module.exports = { DataFiles }