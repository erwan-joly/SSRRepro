/**
 * Server Side Rendering
 */
import { StaticRouter } from 'react-router-dom/server';
import App from '../pages/_app';
import { v4 } from 'uuid';
import { parse } from 'cookie';
import { Request, Response } from 'express';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { Writable } from 'stream';
import { getDataFromTree } from "@apollo/client/react/ssr";
import fetch from 'cross-fetch';
import { setContext } from '@apollo/client/link/context';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';

export const render = async (req: Request, res: Response) => {
    let didError = false;
    const writable = new Writable({
        write(chunk, _encoding, cb) {
            res.write(chunk, cb);
        },
        final() {
            res.end();
        },
    });
    const cookies = parse(req.headers["cookie"] ?? req.headers["cookie"] ?? '');
    const nonce = v4();
    const uri = `https://localhost:5001/graphql`;
    const uploadLink = createUploadLink({
        uri,
        fetch,
        credentials: 'same-origin'
    });

    const authLink = setContext((_, { headers }) => {
        const token = cookies.accessToken;
        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : ''
            }
        };
    });

    const client = new ApolloClient({
        ssrMode: true,
        ssrForceFetchDelay: 100,
        link: authLink.concat(uploadLink),
        cache: new InMemoryCache(),
    });

    const jsx = <ApolloProvider client={client}>
        <StaticRouter location={req.url}>
            <App />
        </StaticRouter>
    </ApolloProvider>;
    await getDataFromTree(jsx);
    const stream = ReactDOMServer.renderToPipeableStream(
        jsx,
        {
            onShellReady() {
                res.statusCode = didError ? 500 : 200;
                res.setHeader('Content-type', 'text/html');
                stream.pipe(writable);
            },
            onShellError(error) {
                res.statusCode = 500;
                res.send(
                    `<html><body>${error.toString()}</body></html>`
                );
            },
            bootstrapScriptContent: `
window.__APOLLO_STATE__= ${JSON.stringify(client.extract()).replace(/</g, '\\u003c')};
`,
            nonce: nonce,
            onError(err) {
                didError = true;
                console.error(err);
            }
        }
    );

    setTimeout(() => stream.abort(), 10000);
};