import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* General Favicons */}
        <link rel="icon" href="/favicon.svg" sizes="any" /> {/* `sizes="any"` is good for ICOs */}
        {/* You can add specific PNG sizes if you prefer, e.g.: */}
        {/* <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" /> */}
        {/* <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" /> */}

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/favicon.svg" />

        {/* Web App Manifest (see step 4) */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme Color (optional - for browser UI theming) */}
        <meta name="theme-color" content="#49d0ae" /> {/* Your app's primary color */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}