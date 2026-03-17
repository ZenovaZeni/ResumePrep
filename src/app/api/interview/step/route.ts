import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runInterviewStep } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { session_id, question_index, last_answer } = body as {
      session_id: string;
      question_index: number;
      last_answer?: string;
    };
    if (!session_id || typeof question_index !== "number") {
      return NextResponse.json(
        { error: "session_id and question_index required" },
        { status: 400 }
      );
    }

    const { data: session } = await supabase
      .from("interview_sessions")
      .select("interview_type, role_context, feedback")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const result = await runInterviewStep(
      session.interview_type,
      question_index,
      last_answer,
      session.role_context ?? undefined
    );

    const existingFeedback = session.feedback;
    const feedbackArr = Array.isArray(existingFeedback)
      ? existingFeedback
      : [];
    const newEntry = {
      questionIndex: question_index,
      feedback: result.feedback,
      question: result.question,
    };
    const updatedFeedback = [...feedbackArr, newEntry];

    await supabase
      .from("interview_sessions")
      .update({ feedback: updatedFeedback })
      .eq("id", session_id)
      .eq("user_id", user.id);

    return NextResponse.json({
      question: result.question,
      feedback: result.feedback,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
