import * as yargs from 'yargs'
import fetch from 'node-fetch'
import { buildDownloadList, downloadFile } from './utils'
import asyncPool from 'tiny-async-pool'
import retry from 'promise-retry'


const API_ROOT = 'https://api.github.com/repos'

function getReleaseUrl(user: string, repo: string): string {
    return `${API_ROOT}/${user}/${repo}/releases`
}

async function main() {
    const {argv} = yargs
        .option('user', {
            alias: 'u',
            description: 'GitHub repo owner',
            type: 'string',
        })
        .option('repo', {
            alias: 'r',
            description: 'GitHub repo name',
            type: 'string',
        })
        .option('dir', {
            alias: 'd',
            description: 'Files store to',
            type: 'string',
        })
        .help()
        .alias('help', 'h')

    const release = getReleaseUrl(argv.user, argv.repo)
    const response = await fetch(release)
        .then(res => res.json())

    const downloads = buildDownloadList(response, argv.dir)

    await asyncPool(10, downloads, it => retry((ret, number) => {
        if (number > 1) {
            console.log(`[Error]: retry=${number}, url=${it.url}`)
        }

        return downloadFile(it.url, it.dest)
            .catch(ret)
    }))
    console.log('All downloads done!')
}

main()
