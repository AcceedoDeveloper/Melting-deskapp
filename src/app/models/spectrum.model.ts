export interface Spectrum {
    headers: SpectrumHeader[];
    elements: SpectrumElement[][];
}

export interface SpectrumElement {
    ElementName: string;
    SelectedLineName: string;
    Type: string;
    reportedResult: SpectrumResult;
    results: SpectrumResult[];
}


export interface SpectrumHeader { 
    name: string;
    value: string;
}

export interface SpectrumResult { 
    Type: string;
    Kind: string;
    StatType: string;
    AcceptanceStatus: string;
    CalibrationStatus: string;
    DisplayUnit: string;
    ExtStatus: string;
    IsDeleted: string;
    Status: string;
    Unit: string;
    WarningStatus: string;
    resultValue: number;
    limits: {
        LowerAcceptanceLimit: number;
        LowerWarningLimit: number;
        UpperAcceptanceLimit: number;
        UpperWarningLimit: number;
    }
}