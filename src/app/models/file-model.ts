export interface AcFile {
    name: string;
    path: string;
    new: boolean;
    info: {
        birthtime: string; // created time
        size: string;
        mtime: string; // modified time
        ctime: string; // modified time
        atime: string; // access time
    };
}