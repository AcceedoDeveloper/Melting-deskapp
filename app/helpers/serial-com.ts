import { readFileAsXml } from './get-file-name';
import { SerialPort } from 'serialport';
import { parseString } from 'xml2js';

const parseXml = (xmlContent) => {

    return new Promise((resolve, reject) => {
        parseString(xmlContent, { trim: true }, function (err, results) {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                console.log('test')
                const opData = {}
                const sampleResult = results.SampleResults.SampleResult[0];
                const headerResults = sampleResult.SampleIDs[0].SampleID || [];
                const elementsTypes = sampleResult.MeasurementStatistics[0].Measurement[0].Elements[0].Element;

                const elements = elementsTypes.filter(elem => elem.$.Type === 'Element')

                let finalData = elements.map(element => {
                    const result = {
                        ...element.$
                    }
                    const concResults = element.ElementResult
                        .filter(res => res.$.Type === 'Conc')
                        .map(res => {
                            let limits = !res.ResultValueLimits[0] ? [] : res.ResultValueLimits[0].ResultValueLimit;
                            if (limits.length) {
                                limits = limits.reduce((acc, limit) => {
                                    acc[limit.$.Type] = limit._ ? +limit._ : 0
                                    return acc
                                }, {});
                            } else {
                                limits = null;
                            }
                            return {
                                ...res.$,
                                resultValue: res.ResultValue ? +res.ResultValue[0] : 0,
                                limits
                            }
                        });
                    result['results'] = concResults
                    result['reportedResult'] = concResults.find(res => res.StatType === 'Reported')
                    return result
                });

                opData['elements'] = finalData;


                const headerData = headerResults.map((result) => ({
                    name: result.IDName[0],
                    value: result.IDValue[0]
                }));

                opData['headers'] = headerData;
                resolve(opData)
            }
        })
    })


}

export const readFileAndGetJson = async (filePath) => {
    const xmlContent = await readFileAsXml(filePath);
    const result = await parseXml(xmlContent);

    return result;
}


export const sendDataSerialPort = async (path, data) => {
    return new Promise((resolve, reject) => {
        const port = new SerialPort({
            path,
            baudRate: 9600
        });
        port.on('error', (err) => {
            // console.log('error occured', err)
            port.close();
            return reject(err);
        })
        // $H:124483,G:Grey,T:A.S,ST:AI-Initial,C:3.50699,Si:1.63319,Mn:0.639766,P:0.0595395,S:0.08,Cr:0.0666722,Mo:0.00593579,Ni:0.0106145,Al:0.00224165,Co:0.00354354,Cu:0.250841,Nb:0.00219472,Ti:0.0272454,V:0.00635257,W:0.0002,Pb:0.00281755,Sn:0.0200302,Mg:0.000500656,As:0.00320924,Zr:0.00063529,Bi:0.00241148,Ca:0.0002,Ce:0.000954009,Sb:0.000654718,Te:0.0008,B:0.000849607,Zn:0.00528085,N:0.00965143,O:0.012,Fe:93.6447#
        port.write(data, (err) => {
            // give a timeout to send full data
            setTimeout(() => {
                port.close()
                if (err) {
                    return reject(err)
                } else {
                    resolve('success');
                }
            }, 1000 * 2)

        })
    })

}

