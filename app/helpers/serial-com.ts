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


// export const sendDataSerialPort = async (path, data) => {
//     return new Promise((resolve, reject) => {
//         const port = new SerialPort({
//             path,
//             baudRate: 9600
//         });
//         port.on('error', (err) => {
//             // console.log('error occured', err)
//             return reject(err);
//         })
//         port.write(data, (err) => {
//             // console.log('error', err)
//             if (err) {
//                 return reject(err)
//             } else {
//                 resolve('success');
//             }
//             port.close();
//         })
//     })

// }




export const sendDataSerialPort = async (path, data) => {
  return new Promise((resolve, reject) => {

    const port = new SerialPort({
      path,
      baudRate: 9600
    });

    let buffer = '';

    port.on('data', (chunk) => {
      const str = chunk.toString();
      console.log("Received from device:", str);
      buffer += str;

 

   

  if (buffer.includes('$hardwareAck#')) {
    port.close();
    return resolve('$hardwareAck#');
  }

      if (buffer.includes('$ack#')) {
        port.close();
        resolve('$ack#');
      }
    });

    port.on('error', (err) => reject(err));

    port.write(data, (err) => {
      if (err) reject(err);
      else console.log("Data sent to device:", data);
    });
  });
};
