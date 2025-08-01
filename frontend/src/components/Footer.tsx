export default function Footer() {
    return (
      <footer className="border-t border-muted bg-background/90 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted">
          <span>&copy; {new Date().getFullYear()} Thrust AI. All rights reserved.</span>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* <a href="#" className="hover:text-accent transition-colors duration-150">
              Contact
            </a>
            <a href="#" className="hover:text-accent transition-colors duration-150">
              Privacy
            </a>
            <a href="#" className="hover:text-accent transition-colors duration-150">
              Terms
            </a> */}
          </div>
        </div>
      </footer>
    );
  }
  