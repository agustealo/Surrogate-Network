import { Network, Heart, Mail, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Network className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">Surrogate Companion</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Build meaningful connections through needs-based relationships. 
              Discover what you need, offer what you can give, and grow together.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link></li>
              <li><Link href="/principles" className="hover:text-foreground transition-colors">Principles</Link></li>
              <li><Link href="/safety" className="hover:text-foreground transition-colors">Safety</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
              <li><Link href="/accessibility" className="hover:text-foreground transition-colors">Accessibility</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Surrogate Companion. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}