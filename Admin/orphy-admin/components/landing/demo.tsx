import Image from "next/image";

interface DemoProps {
  imageSrc?: string;
  alt?: string;
  className?: string;
}

export default function Demo({
  imageSrc = "/demo-screenshot.png",
  alt = "Capture d'écran d'Orphy en action",
  className = "",
}: DemoProps) {
  return (
    <div id="demo" className="py-14 sm:px-0 px-4">
      <div className="flex flex-col items-center justify-center gap-4 mb-8">
        <h2 className="text-3xl font-semibold text-foreground">
          Comment ça marche ?
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Un clic sur l&apos;élément, un commentaire, c&apos;est envoyé.
        </p>
      </div>
      <div className={`bg-muted/40 rounded-lg p-2 max-w-3xl mx-auto ${className}`}>
        {/* Browser window dots */}
        <div className="flex flex-row justify-start items-center gap-2 p-2">
          <span className="flex h-3 w-3 rounded-full bg-red-400" />
          <span className="flex h-3 w-3 rounded-full bg-yellow-400" />
          <span className="flex h-3 w-3 rounded-full bg-green-400" />
        </div>
        {/* Screenshot container */}
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={alt}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Ajouter une capture d&apos;écran dans /public/demo-screenshot.png</p>
            </div>
          )}
        </div>
      </div>
      {/* Steps below the image */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mt-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D4A373] text-white text-sm font-semibold">1</span>
          <span className="text-sm text-muted-foreground">Le client clique</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D4A373] text-white text-sm font-semibold">2</span>
          <span className="text-sm text-muted-foreground">Il commente</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D4A373] text-white text-sm font-semibold">3</span>
          <span className="text-sm text-muted-foreground">Vous corrigez</span>
        </div>
      </div>
    </div>
  );
}
