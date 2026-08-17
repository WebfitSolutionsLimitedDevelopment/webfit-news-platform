import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
export default function SupportSuccess(){return <><SiteHeader/><main className="static-page support-thanks"><span>Thank you</span><h1>Your support strengthens Webfit News.</h1><p>Thank you for backing independent journalism and community reporting. Your contribution helps us keep publishing work that is useful, accessible and accountable.</p><Link className="support-pay inline" href="/">Return to Webfit News</Link></main><PublicFooter/></>}
