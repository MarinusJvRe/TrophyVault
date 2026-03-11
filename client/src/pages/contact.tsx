import { useState } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24" data-testid="page-contact">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-contact-title">Get in Touch</h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Have a question, suggestion, or need assistance? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-[#b87333]/10 flex items-center justify-center mb-4">
                <Mail className="h-5 w-5 text-[#b87333]" />
              </div>
              <h3 className="font-serif font-semibold mb-2">Email Us</h3>
              <p className="text-white/50 text-sm mb-3">For general inquiries and support</p>
              <a
                href="mailto:support@honorthehunt.com"
                className="text-[#b87333] hover:text-[#d4935f] text-sm font-medium transition-colors"
                data-testid="link-email-support"
              >
                support@honorthehunt.com
              </a>
            </div>

            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-[#b87333]/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-5 w-5 text-[#b87333]" />
              </div>
              <h3 className="font-serif font-semibold mb-2">Suggestions</h3>
              <p className="text-white/50 text-sm mb-3">Help us improve Honor The Hunt</p>
              <a
                href="mailto:suggestions@honorthehunt.com"
                className="text-[#b87333] hover:text-[#d4935f] text-sm font-medium transition-colors"
                data-testid="link-email-suggestions"
              >
                suggestions@honorthehunt.com
              </a>
            </div>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 px-6 rounded-xl bg-white/[0.02] border border-[#b87333]/20"
              data-testid="contact-success-message"
            >
              <div className="w-14 h-14 rounded-full bg-[#b87333]/10 flex items-center justify-center mx-auto mb-4">
                <Send className="h-6 w-6 text-[#b87333]" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Message Sent</h3>
              <p className="text-white/60 text-sm">Thank you for reaching out. We'll get back to you as soon as possible.</p>
            </motion.div>
          ) : (
            <div className="p-6 sm:p-8 rounded-xl bg-white/[0.02] border border-white/5">
              <h2 className="font-serif text-xl font-semibold mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm text-white/60 mb-1.5">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#b87333] transition-colors"
                    placeholder="Your name"
                    data-testid="input-contact-name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm text-white/60 mb-1.5">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#b87333] transition-colors"
                    placeholder="you@example.com"
                    data-testid="input-contact-email"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm text-white/60 mb-1.5">Message</label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#b87333] transition-colors resize-none"
                    placeholder="Tell us how we can help..."
                    data-testid="input-contact-message"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#b87333] hover:bg-[#a0622d] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  data-testid="button-contact-submit"
                >
                  <Send className="h-4 w-4" /> Send Message
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </MarketingLayout>
  );
}
