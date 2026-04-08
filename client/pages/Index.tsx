import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Index() {
  return (
    <div className="min-h-screen detectify-bg overflow-hidden flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-stretch px-6 md:px-16 pb-12 relative">
        {/* Left: Text Content */}
        <div className="flex flex-col justify-center flex-1 z-10 pt-4 lg:pt-8 lg:pb-16">
          {/* Heading */}
          <h1 className="font-outfit font-bold text-5xl sm:text-6xl md:text-7xl xl:text-[96px] leading-none capitalize text-black max-w-[810px]">
            say it, see it,{" "}
            <br className="hidden sm:block" />
            sort it
          </h1>

          {/* Subtitle */}
          <p className="font-outfit font-medium text-lg sm:text-xl md:text-2xl xl:text-[26px] text-white opacity-86 mt-6 max-w-[500px] leading-normal">
            Made for those who need it the most. Helps in the identification of
            medicine currency and more
          </p>

          {/* Mobile image */}
          <div className="lg:hidden flex justify-center mt-8">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/b9069d124f992e57ca0145a6a7acebc32d1022cc?width=1062"
              alt="Person using Detectify"
              className="w-64 sm:w-80 object-contain"
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10 lg:mt-16">
            <Link
              to="/user"
              className="inline-flex items-center justify-center bg-forest text-white font-outfit font-medium text-2xl sm:text-3xl xl:text-[40px] tracking-[6.8px] rounded-full px-12 py-5 hover:bg-forest/90 transition-colors"
            >
              USER
            </Link>
            <Link
              to="/helper"
              className="inline-flex items-center justify-center border-4 border-forest text-forest font-outfit font-medium text-2xl sm:text-3xl xl:text-[40px] tracking-[6.8px] rounded-full px-12 py-5 hover:bg-forest/10 transition-colors"
            >
              HELPER
            </Link>
          </div>
        </div>

        {/* Right: Image (desktop only) */}
        <div className="hidden lg:flex items-end justify-center flex-shrink-0 w-[45%] xl:w-[40%]">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/b9069d124f992e57ca0145a6a7acebc32d1022cc?width=1062"
            alt="Person using Detectify"
            className="h-[80vh] max-h-[800px] w-auto object-contain object-bottom"
          />
        </div>
      </main>
    </div>
  );
}
