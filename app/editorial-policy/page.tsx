import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/PublicFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Editorial Policy and Standards',
  description: 'How Webfit News reports, verifies, labels and corrects its journalism, and how readers can raise a concern.',
  alternates: { canonical: absoluteUrl('/editorial-policy') },
};

export default function EditorialPolicy() {
  return (
    <>
      <SiteHeader />
      <main className="static-page">
        <span className="article-kicker">Standards and accountability</span>
        <h1>Editorial Policy</h1>
        <p className="standfirst">
          Webfit News covers New Zealand and the communities that call it home, including Indian and other diaspora communities.
          Our journalism is guided by accuracy, fairness, independence and accountability to readers.
        </p>
        <p>
          We are a member of the New Zealand Media Council and follow its{' '}
          <a href="https://www.mediacouncil.org.nz/principles/">published principles</a>.
          These standards apply to our reporting across the website, e-paper, video and official social channels.
          They apply to editors, reporters, contributors and volunteers acting for Webfit News.
        </p>

        <h2>Accuracy, sources and attribution</h2>
        <p>
          We check material facts and use original documents, direct interviews and other first-hand sources where possible.
          We attribute reporting, quotes, images and data to their source. A press release, campaign claim or social post is
          a starting point for reporting and should be identified as such when its origin matters to the reader.
          We say what has been confirmed, what is alleged and what remains unclear.
        </p>
        <p>
          Headlines, captions, thumbnails and social posts must reflect the underlying reporting. We label opinion and analysis
          so readers can distinguish them from straight news. We clearly mark significant updates when facts change.
        </p>

        <h2>Fairness and right of reply</h2>
        <p>
          We seek a response from people or organisations facing significant criticism or allegations, give them a reasonable
          opportunity to reply, and report the substance of relevant responses fairly. When a response is sought and unavailable
          by publication, we say so where it matters and consider adding it when it arrives. We give relevant perspectives
          fair weight based on the evidence.
        </p>

        <h2>Editorial independence and commercial content</h2>
        <p>
          Editors decide what to cover and publish. Advertisers, sponsors, event organisers and partners do not control our
          independent reporting. We clearly label paid material as advertising or sponsored content before readers engage with it.
          We disclose relationships, hospitality or other interests when they could reasonably affect how readers assess coverage.
          Contributors must tell the editor about relevant conflicts before taking an assignment.
        </p>

        <h2>Privacy, safety and community coverage</h2>
        <p>
          We weigh the public interest before publishing private information or sensitive images. We take particular care
          with children, grieving families, victims and other people in vulnerable situations. We respect applicable
          reporting restrictions, including court suppression orders. We mention a person’s ethnicity, religion, immigration status
          or other personal characteristics when they are genuinely relevant to the story.
        </p>
        <p>
          We seek informed permission for interviews and recordings where appropriate. We protect confidential sources
          and use anonymity only where there is a sound editorial reason. An editor must approve sensitive reporting
          methods, including covert recording, before use.
        </p>

        <h2>Photos, video, translations and AI</h2>
        <p>
          Images and footage must represent events accurately. We credit third-party material and identify file photos,
          composites, illustrations and significant alterations when readers could otherwise mistake them for a record of the event.
          We do not present synthetic images, audio or video as authentic evidence.
        </p>
        <p>
          We may use tools to help with transcription, translation, editing or production. An editor remains accountable
          for what we publish. We verify material facts and quotations against source material, check translations for
          meaning and context, and disclose substantial use of generated content when it matters to readers.
          We keep confidential source information out of unapproved tools.
        </p>

        <h2>Corrections and complaints</h2>
        <p>
          We correct significant errors promptly and explain material changes in the published item. When an error also
          appeared in an e-paper, video or social post, we take reasonable steps to correct it where it appeared.
        </p>
        <p>
          The <Link href="/corrections">Corrections and complaints page</Link> explains how to contact the newsroom
          and when you can take an unresolved complaint to the New Zealand Media Council.
        </p>
      </main>
      <PublicFooter />
    </>
  );
}
