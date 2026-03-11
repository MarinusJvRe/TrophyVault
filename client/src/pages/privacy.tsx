import MarketingLayout from "@/components/MarketingLayout";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24" data-testid="page-privacy">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2" data-testid="text-privacy-title">Privacy Policy</h1>
          <p className="text-white/40 text-sm mb-12">Last updated: March 1, 2026</p>

          <div className="space-y-8">
            <Section title="1. Information We Collect">
              <p>We collect information you provide directly when creating an account, including your name, email address, and profile details. When you use our Service, we also collect:</p>
              <ul>
                <li>Trophy photographs and associated metadata (location, date, species)</li>
                <li>Device information and usage data</li>
                <li>AI analysis results and 3D model data</li>
                <li>Communication data when you contact support</li>
              </ul>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve the Service</li>
                <li>Process AI trophy identification and 3D model generation</li>
                <li>Personalize your experience and trophy room</li>
                <li>Communicate with you about the Service, including updates and support</li>
                <li>Analyze usage patterns to improve our features</li>
                <li>Enforce our Terms of Service and protect against misuse</li>
              </ul>
            </Section>

            <Section title="3. Data Storage and Security">
              <p>Your data is stored on secure servers with industry-standard encryption. Trophy photographs and 3D models are stored using encrypted cloud storage. We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, or destruction.</p>
            </Section>

            <Section title="4. Data Sharing">
              <p>We do not sell your personal information to third parties. We may share your data in the following circumstances:</p>
              <ul>
                <li>With your consent, when you choose to make your trophy room public</li>
                <li>With service providers who help us operate the Service (hosting, AI processing)</li>
                <li>When required by law, regulation, or legal process</li>
                <li>To protect the rights, property, or safety of our users or the public</li>
              </ul>
            </Section>

            <Section title="5. Your Rights">
              <p>Depending on your location, you may have the following rights regarding your personal data:</p>
              <ul>
                <li>Access and receive a copy of your data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your account and associated data</li>
                <li>Export your trophy data in a standard format</li>
                <li>Object to or restrict certain data processing</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </Section>

            <Section title="6. Cookies and Tracking">
              <p>We use essential cookies to maintain your session and preferences. We may use analytics cookies to understand how the Service is used. You can manage cookie preferences through your browser settings.</p>
            </Section>

            <Section title="7. Location Data">
              <p>When you add location information to your trophies, this data is stored with your trophy records. You can choose not to include location data. If your trophy room is set to private, location data is not visible to other users.</p>
            </Section>

            <Section title="8. Children's Privacy">
              <p>The Service is not intended for users under 16 years of age. We do not knowingly collect personal information from children under 16. If we learn that we have collected personal information from a child under 16, we will take steps to delete that information.</p>
            </Section>

            <Section title="9. Data Retention">
              <p>We retain your data for as long as your account is active or as needed to provide the Service. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes.</p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service. Your continued use of the Service after such changes constitutes acceptance of the updated policy.</p>
            </Section>

            <Section title="11. Contact Us">
              <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at <a href="mailto:privacy@honorthehunt.com" className="text-[#b87333] hover:text-[#d4935f] transition-colors" data-testid="link-privacy-email">privacy@honorthehunt.com</a>.</p>
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
