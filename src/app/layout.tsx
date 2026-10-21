import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'MARK FASHION | Custom Apparel Manufacturing',description:'Custom T-shirts, polos, jerseys and printing. Select your fabric, GSM and specifications, then request a quote.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
