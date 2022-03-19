export interface AcFile {
    name: string;
    path: string;
    info: {
        birthtime: string; // created time
        size: string;
        mtime: string; // modified time
        ctime: string; // modified time
        atime: string; // access time
    };
}