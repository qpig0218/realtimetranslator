import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Loader2, Mic, MicOff, StopCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function TranslationSession() {
  const [, params] = useRoute("/session/:id");
  const sessionId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [transcripts, setTranscripts] = useState<
    Array<{ original: string; translated: string; timestamp: Date }>
  >([]);
  const transcriptsEndRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = trpc.translation.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const translateMutation = trpc.translation.translateText.useMutation({
    onSuccess: (data, variables) => {
      setTranscripts((prev) => [
        ...prev,
        {
          original: variables.text,
          translated: data.translatedText,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error) => {
      toast.error(`翻譯失敗: ${error.message}`);
    },
  });

  const endSessionMutation = trpc.translation.endSession.useMutation({
    onSuccess: () => {
      toast.success("會話已結束");
      setLocation(`/summary/${sessionId}`);
    },
    onError: (error) => {
      toast.error(`結束會話失敗: ${error.message}`);
    },
  });

  const { isRecognizing, interimText, startRecognition, stopRecognition } =
    useSpeechRecognition({
      sourceLanguage: session?.sourceLanguage || "zh-Hant",
      onRecognized: (text, confidence) => {
        if (text.trim()) {
          translateMutation.mutate({
            sessionId,
            text,
            confidence,
          });
        }
      },
      onError: (error) => {
        toast.error(`語音辨識錯誤: ${error}`);
      },
    });

  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, interimText]);

  const handleToggleRecognition = () => {
    if (isRecognizing) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  const handleEndSession = () => {
    if (isRecognizing) {
      stopRecognition();
    }
    endSessionMutation.mutate({ sessionId });
  };

  if (authLoading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">請先登入以使用即時翻譯功能</p>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>登入</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">找不到會話</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              <p className="text-sm text-muted-foreground">
                {session.sourceLanguage} → {session.targetLanguage}
                {session.scenario && ` | ${session.scenario}`}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
            >
              {endSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  結束中...
                </>
              ) : (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  結束會話
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Transcripts Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          {transcripts.map((t, idx) => (
            <Card key={idx} className="bg-white/90 backdrop-blur">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      原文
                    </span>
                    <p className="text-lg">{t.original}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase">
                      譯文
                    </span>
                    <p className="text-lg font-medium text-primary">{t.translated}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {interimText && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">辨識中...</p>
                <p className="text-lg italic">{interimText}</p>
              </CardContent>
            </Card>
          )}
          <div ref={transcriptsEndRef} />
        </div>
      </div>

      {/* Subtitle Bar */}
      <div className="bg-black/80 text-white p-6 backdrop-blur">
        <div className="container mx-auto max-w-4xl">
          {transcripts.length > 0 ? (
            <div className="text-center">
              <p className="text-2xl font-medium leading-relaxed">
                {transcripts[transcripts.length - 1].translated}
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-400">等待語音輸入...</p>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border-t p-4">
        <div className="container mx-auto max-w-4xl flex justify-center">
          <Button
            size="lg"
            variant={isRecognizing ? "destructive" : "default"}
            onClick={handleToggleRecognition}
            className="rounded-full h-16 w-16"
          >
            {isRecognizing ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
