import { NativeModules, Platform, Linking, AppState } from 'react-native';
import MimeTypes from "./mimeType";

const { ReceiveSharingIntent } = NativeModules;

const isIos = Platform.OS === 'ios';

export default class ReceiveSharingIntentModule {
    
    static getReceivedFiles = (handler, errorHandler) => {
        if (isIos) {
            Linking.getInitialURL().then(res => {
                if (res && res.startsWith("ShareMedia://dataUrl")) {
                    this.getFileNames(handler, errorHandler, res);
                }
            }).catch(e => { });
            Linking.addEventListener("url", (res) => {
                console.log(res);
                let url = res ? res.url : "";
                if (url.startsWith("ShareMedia://dataUrl")) {
                    this.getFileNames(handler,errorHandler, res.url);
                }
            });
        }else{
            AppState.addEventListener('change', (status) => {
                if (status === 'active') {
                    this.getFileNames(handler,errorHandler, null);
                }
              });
            this.getFileNames(handler,errorHandler, null);
        }
    }


    static getFileNames = (handler,errorHandler, url) => {
        if(isIos){
        ReceiveSharingIntent.getFileNames(url).then(data=>{         
             let files = iosSortedData(data);
             handler(files);
        }).catch(e=>errorHandler(e));
        }else{
            ReceiveSharingIntent.getFileNames().then(fileObject => {
                let files = Object.keys(fileObject).map((k) => fileObject[k])
                handler(files);
            }).catch(e=>{
                errorHandler(e)
            })
        }
    }


    static clearReceivedFiles = () => {
        ReceiveSharingIntent.clearFileNames();
    }

}


const iosSortedData = (data) => {
    let objects = { filePath: null, text: null, weblink: null, mimeType: null, contentUri: null, fileName: null, extension: null };
    let file = data;
    try {
        let files = JSON.parse(file)
        let object = [];
        for (let i = 0; i < files.length; i++) {
            let path = files[i].path;
            let obj = {
                ...objects,
                fileName: getFileName(path),
                extension: getExtension(path),
                mimeType: getMimeType(path),
                filePath: path
            }
            object.push(obj);
        }
        return object;
    } catch (error) {
        return [{ ...objects }];
    }
}


var getFileName = (file) => {
    return file.replace(/^.*(\\|\/|\:)/, '');
}

var getExtension = (fileName) => {
    return fileName.substr(fileName.lastIndexOf('.') + 1);
}

var getMimeType = (file) => {
    let ext = getExtension(file);
    let extension = "." + ext.toLowerCase();
    if (MimeTypes[extension]) {
        return MimeTypes[extension];
    }
    return null
}
