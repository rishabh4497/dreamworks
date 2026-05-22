import { Wrench, BookOpen, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ModdingSandbox() {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue" /> Modding Sandbox V2
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Automatically generate modding templates and SDKs for your engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-separator bg-card-active p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue" />
              <h3 className="text-[14px] font-semibold text-foreground">Generate SDK Docs</h3>
            </div>
            <p className="text-[11px] text-muted/70 mb-4">
              AI parses your Unreal Engine header files and creates a public Wiki for modders to reference.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="w-full text-[11px]">Generate Docs</Button>
        </div>

        <div className="rounded-xl border border-separator bg-card-active p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4 text-green" />
              <h3 className="text-[14px] font-semibold text-foreground">Export Mod Template</h3>
            </div>
            <p className="text-[11px] text-muted/70 mb-4">
              Create a boilerplate "Hello World" mod zip file that users can immediately load into their game.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="w-full text-[11px]">Download Template.zip</Button>
        </div>
      </div>
    </Card>
  );
}
