export default function Html({
    children,
}: {
    children: any
}) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
            </head>
            <body>
                    {children}
            </body>
        </html >);
};
