import { Euara, EuaraConfig, NpmUtils, Manifest, ReleaseDownload } from 'euara-lib';
import * as fs from 'fs';
var targz = require('targz');

export class EUARABS {
    euara: Euara = new Euara();
    npm: NpmUtils = new NpmUtils();
    config: CurrentReleaseConfig;
    constructor(
        private manifestName: string,
        private appDir: string) {
        this.config = new CurrentReleaseConfig(appDir + '/config.json');
    }

    async getAppEntryPoint(): Promise<string> {
        return await this.getLocalOrDownloadTarball(this.config.currentVersion || 'latest');
    }

    async downloadLatest(): Promise<ReleaseDownload> {
        return await this.getVersion('latest');
    }

    async getVersion(version: string): Promise<ReleaseDownload> {
        console.log('Getting Release', version);
        let release = await this.euara.downloadRelease(this.manifestName, version);
        if(release.validity.isValid != true) {
            throw "Latest version is not valid!";
        }
        console.log('Recieved Release', release.manifest.version);
        await this.storeRelease(release);
        return release;
    }

    async getLocalOrDownloadTarball(version: string) {
        let path = this.getTarballPath(version);
        if(fs.existsSync(path)) {
            return path;
        }
        let release = await this.getVersion(version);
        if(version == 'latest') {
            path = this.getTarballPath(release.manifest.manifestVersion);
        }
        return path;
    }

    async storeRelease(release: ReleaseDownload): Promise<void> {
        let tarballPath = this.getTarballPath(release.manifest.manifestVersion);
        let manifestFile = tarballPath + '/manifest.json';
        await extract(release.tarball, tarballPath);
        await writeFile(manifestFile, release.manifest.toString());
        updateBaseUrlInVersion(tarballPath);
        return;
    }

    private getTarballPath(version: string) {
        return this.appDir + '/' + version;
    }


}

export class CurrentReleaseConfig {
    private configObject: any;

    constructor(private configPath: string) {
        if(fs.existsSync(configPath)) {
            let data = fs.readFileSync(configPath).toString();
            this.configObject = JSON.parse(data);
        } else {
            this.configObject = {};
        }
    }

    get currentVersion(): string {
        return this.configObject.currentVersion || "";
    }

    set currentVersion(version: string) {
        this.configObject.currentVersion  = version;
    }

    get versions(): string[] {
        return this.configObject.versions || [];
    }

    set versions(versions: string[]) {
        this.configObject.versions  = versions;
    }

    public save() {
        writeFile(this.configPath, JSON.stringify(this.configObject));
    }
}


function extract(file: string, dest: string) {
    return new Promise<string>((resolve, reject) => {
        targz.decompress({
            src: file,
            dest: dest
        }, function(err){
            if(err) {
                console.log(err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function copyFile(from: string, to: string): Promise<string>{
    return new Promise<string>((resolve, reject) => {
        console.log(from);
        if(fs.existsSync(from)) {
            let readStream = fs.createReadStream(from, 'binary');
            let writeStream = fs.createWriteStream(to);
            readStream.pipe(writeStream);

            writeStream.on('finish', () => resolve());
            writeStream.on('error', (err) => reject(err));
        }
    });
}


function writeFile(fileName: string, data: string): Promise<string>{
    return new Promise<string>((resolve, reject) => {
        fs.writeFile(fileName, data, (err) => {
            if(err) {
                reject(err);
            }
            resolve();
        })
    });
}

function updateBaseUrlInVersion(dir: string) {
    console.log(dir + '/index.html');
    if(fs.existsSync(dir + '/index.html')) {
        let data = fs.readFileSync(dir + '/index.html').toString();
        let baseUrl = dir + '/';
        data = data.replace('<base href="/">', `<base href="${baseUrl}">`)
        fs.writeFileSync(dir + '/index.html', data);
    }
}