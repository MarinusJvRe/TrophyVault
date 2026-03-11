import MarketingLayout from "@/components/MarketingLayout";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24" data-testid="page-terms">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2" data-testid="text-terms-title">Terms & Conditions</h1>
          <p className="text-white/40 text-sm mb-12">Last updated: March 1, 2026</p>

          <div className="prose-custom space-y-8">
            <Section title="1. Acceptance of Terms">
              <p>By accessing or using Honor The Hunt ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.</p>
            </Section>

            <Section title="2. Description of Service">
              <p>Honor The Hunt is a digital platform that allows hunters to document, preserve, and share their hunting trophies through AI-powered identification, 3D modeling, and virtual trophy room features. The Service is provided on both mobile and desktop platforms.</p>
            </Section>

            <Section title="3. User Accounts">
              <p>To use certain features of the Service, you must create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account and to keep this information up to date.</p>
            </Section>

            <Section title="4. User Content">
              <p>You retain ownership of all content you upload to the Service, including photographs, trophy data, and other materials ("User Content"). By uploading User Content, you grant Honor The Hunt a non-exclusive, worldwide, royalty-free license to use, display, and process your content solely for the purpose of providing the Service.</p>
              <p>You agree not to upload content that is illegal, offensive, or infringes on the rights of others. We reserve the right to remove any content that violates these terms.</p>
            </Section>

            <Section title="5. AI-Powered Features">
              <p>Our AI trophy identification and scoring features are provided for informational purposes only. While we strive for accuracy, AI-generated identifications and scores should not be relied upon as official measurements or classifications. Always verify trophy scores through certified scoring organizations for official records.</p>
            </Section>

            <Section title="6. Subscription Plans">
              <p>Honor The Hunt offers free and paid subscription plans. Paid plans are billed monthly or annually as indicated at the time of purchase. You may cancel your subscription at any time, and your access to paid features will continue until the end of your current billing period.</p>
              <p>We reserve the right to modify pricing with 30 days' advance notice to existing subscribers.</p>
            </Section>

            <Section title="7. Privacy">
              <p>Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as outlined in our Privacy Policy.</p>
            </Section>

            <Section title="8. Prohibited Uses">
              <p>You agree not to use the Service to:</p>
              <ul>
                <li>Violate any applicable laws or regulations</li>
                <li>Upload false, misleading, or fraudulent information</li>
                <li>Promote or document illegal hunting activities</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to access other users' accounts or data</li>
                <li>Reverse engineer or attempt to extract the source code of the Service</li>
              </ul>
            </Section>

            <Section title="9. Limitation of Liability">
              <p>Honor The Hunt is provided "as is" without warranties of any kind, express or implied. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service. Our total liability shall not exceed the amount you have paid for the Service in the twelve months preceding the claim.</p>
            </Section>

            <Section title="10. Termination">
              <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms. Upon termination, your right to use the Service will immediately cease. You may request an export of your data within 30 days of termination.</p>
            </Section>

            <Section title="11. Changes to Terms">
              <p>We may update these Terms from time to time. We will notify you of significant changes via email or through the Service. Your continued use of the Service after such changes constitutes acceptance of the updated terms.</p>
            </Section>

            <Section title="12. Contact">
              <p>If you have questions about these Terms, please contact us at <a href="mailto:legal@honorthehunt.com" className="text-[#b87333] hover:text-[#d4935f] transition-colors" data-testid="link-terms-email">legal@honorthehunt.com</a>.</p>
            </Section>
          </div>
        </motion.div>
      </div>
    </MarketingLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-serif font-semibold mb-3 text-white">{title}</h2>
      <div className="text-white/60 text-sm leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-white/60">
        {children}
      </div>
    </div>
  );
}
