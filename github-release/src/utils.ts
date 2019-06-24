import * as fs from 'fs'
import fetch from 'node-fetch'
import chalk from 'chalk'
import * as path from 'path'

function fileName(base: string, file: ProcessFile) {
    return `${base}/${file.version}/${file.file}`
}


export async function downloadFile(url: string, dest: string): Promise<void> {
    console.log(`${chalk.green('[Downloading]')}: ${url}`)
    const dirname = path.dirname(dest)

    if (!fs.existsSync(dirname)) {
        await fs.promises.mkdir(dirname, {recursive: true})
    }

    const res = await fetch(url)
    const file = fs.createWriteStream(dest)

    res.body.pipe(file)

    return new Promise((resolve, reject) => {
        res.body.on('end', () => {
            console.log(`${chalk.blue('[Finished]')}: ${url}`)
            resolve()
        })
        file.on('error', reject)
    })
}

type ProcessFile = {
    version: string
    file: string
    size: number
    url: string
    dest?: string
}

export function buildDownloadList(response: Array<any>, base: string): Array<ProcessFile> {
    const result = response.reduce((pre: Array<ProcessFile>, curr) => {
        const ret = [...pre]

        for (const file of curr.assets) {
            const doc: ProcessFile = {
                version: curr.name,
                file: file.name,
                size: file.size,
                url: file.browser_download_url,
            }

            doc.dest = fileName(base, doc)

            ret.push(doc)
        }

        return ret
    }, [])
        .filter((it: ProcessFile) => {
            if (!fs.existsSync(it.dest)) {
                return true
            }
            const stat = fs.statSync(it.dest)

            return !(stat.size === it.size)
        })

    return result
}
