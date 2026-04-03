
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  flashcards JSONB NOT NULL DEFAULT '[]',
  quiz_questions JSONB NOT NULL DEFAULT '[]',
  roadmap JSONB NOT NULL DEFAULT '[]',
  quiz_answers JSONB NOT NULL DEFAULT '{}',
  quiz_submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions" ON public.study_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.study_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.study_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sessions" ON public.study_sessions FOR DELETE USING (true);
