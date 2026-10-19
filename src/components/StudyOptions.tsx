import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DIFFICULTIES, DIFFICULTY_LABELS, EXAM_LEVELS, EXAM_LABELS, type StudyOptions as Options } from "../../supabase/functions/_shared/study-options";

export default function StudyOptions({ value, onChange, disabled }: { value: Options; onChange: (value: Options) => void; disabled: boolean }) {
  return <div className="space-y-3 text-ink">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label htmlFor="study-difficulty" className="block pixel-body text-lg font-semibold mb-1">Question difficulty</label>
        <Select value={value.difficulty} onValueChange={(difficulty: Options["difficulty"]) => onChange({ ...value, difficulty })} disabled={disabled}>
          <SelectTrigger id="study-difficulty" className="pixel-input text-ink bg-paper"><SelectValue /></SelectTrigger>
          <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{DIFFICULTY_LABELS[d]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><label htmlFor="study-exam" className="block pixel-body text-lg font-semibold mb-1">Preparation level</label>
        <Select value={value.examLevel} onValueChange={(examLevel: Options["examLevel"]) => onChange({ ...value, examLevel })} disabled={disabled}>
          <SelectTrigger id="study-exam" className="pixel-input text-ink bg-paper"><SelectValue /></SelectTrigger>
          <SelectContent>{EXAM_LEVELS.map((e) => <SelectItem key={e} value={e}>{EXAM_LABELS[e]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
    <label className="flex items-center gap-3 pixel-body text-lg cursor-pointer">
      <Checkbox checked={value.includeNumericals} onCheckedChange={(checked) => onChange({ ...value, includeNumericals: checked === true })} disabled={disabled} className="border-ink data-[state=checked]:bg-pixel-blue data-[state=checked]:text-accent-foreground" />
      Include numerical questions?
    </label>
  </div>;
}