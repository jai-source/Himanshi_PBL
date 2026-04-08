import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="min-h-screen detectify-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          <h2 className="font-outfit font-bold text-4xl md:text-5xl text-black mb-4">
            About
          </h2>
          <p className="font-outfit text-lg text-white/90 mb-8">
            This page is coming soon!
          </p>
          <div className="inline-block border-2 border-forest rounded-full px-8 py-3">
            <span className="font-outfit font-medium text-forest text-xl tracking-widest">
              COMING SOON
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
