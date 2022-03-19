import { Observable, take } from "rxjs";

export function getOnce<T>(obs: Observable<T>) {
    let resFile: T = null;
    obs.pipe(take(1)).subscribe(file => {
        resFile = file
    })
    return resFile;
}