import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DIFFICULTIES, DIFFICULTY_LABELS, EXAM_LEVELS, EXAM_LABELS, SUBJECTS, SUBJECT_LABELS, type StudyOptions as Options } from "../../supabase/functions/_shared/study-options";

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
        <Select value={value.examLevel} onValueChange={(examLevel: Options["examLevel"]) => onChange({ ...value, examLevel, subject: (examLevel === "neet" && value.subject === "mathematics") || (["jee-main","jee-advanced"].includes(examLevel) && value.subject === "biology") ? "auto" : value.subject })} disabled={disabled}>
          <SelectTrigger id="study-exam" className="pixel-input text-ink bg-paper"><SelectValue /></SelectTrigger>
          <SelectContent>{EXAM_LEVELS.map((e) => <SelectItem key={e} value={e}>{EXAM_LABELS[e]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label htmlFor="study-subject" className="block pixel-body text-lg font-semibold mb-1">Subject</label>
        <Select value={value.subject || "auto"} onValueChange={(subject: Options["subject"]) => onChange({ ...value, subject })} disabled={disabled}>
          <SelectTrigger id="study-subject" className="pixel-input text-ink bg-paper"><SelectValue /></SelectTrigger>
          <SelectContent>{SUBJECTS.filter(s => !(value.examLevel === "neet" && s === "mathematics") && !((value.examLevel === "jee-main" || value.examLevel === "jee-advanced") && s === "biology")).map(s => <SelectItem key={s} value={s}>{SUBJECT_LABELS[s]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><label htmlFor="study-chapter" className="block pixel-body text-lg font-semibold mb-1">Chapter (optional)</label>
        <input id="study-chapter" maxLength={100} value={value.chapter ?? ""} onChange={e => onChange({ ...value, chapter: e.target.value })} placeholder="e.g. Electrostatics" disabled={disabled} className="pixel-input text-ink bg-paper w-full p-2" />
      </div>
    </div>
    <label className="flex items-center gap-3 pixel-body text-lg cursor-pointer">
      <Checkbox checked={value.includeNumericals} onCheckedChange={(checked) => onChange({ ...value, includeNumericals: checked === true })} disabled={disabled} className="border-ink data-[state=checked]:bg-pixel-blue data-[state=checked]:text-accent-foreground" />
      Include numerical questions?
    </label>
    <p className="text-xs opacity-80">Original AI topic practice; not an official past paper or full-format mock. Verify important answers.</p>
  </div>;
}