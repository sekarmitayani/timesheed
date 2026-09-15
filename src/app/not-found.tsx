import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
            <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center max-w-md mx-auto">
                <div className="mb-8">
                    <Image
                        src="/logo.png"
                        alt="Haerarchy Logo"
                        width={180}
                        height={50}
                        className="h-10 w-auto object-contain"
                        priority
                    />
                </div>
                
                <h1 className="text-6xl font-black text-slate-800 tracking-tight mb-2">404</h1>
                <h2 className="text-xl font-bold text-slate-700 mb-2">Page Not Found</h2>
                <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                
                <Button asChild className="w-full bg-[#4B7BEC] hover:bg-[#385bb5] text-white rounded-lg h-11 text-sm font-bold tracking-wide transition-all shadow-sm shadow-blue-500/20">
                    <Link href="/">
                        Return to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
}
