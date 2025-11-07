import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Download, FileText, Loader2, Sparkles } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Summary() {
  const [, params] = useRoute("/summary/:id");
  const sessionId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils(); // Move useUtils to component level

  const { data: session, isLoading: sessionLoading } = trpc.translation.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const { data: transcripts, isLoading: transcriptsLoading } =
    trpc.translation.getTranscripts.useQuery({ sessionId }, { enabled: !!sessionId });

  const { data: summaryData, isLoading: summaryLoading } =
    trpc.translation.getSummary.useQuery({ sessionId }, { enabled: !!sessionId });

  const generateSummaryMutation = trpc.translation.generateSummary.useMutation({
    onSuccess: () => {
      toast.success("摘要已生成");
      // Refetch summary using utils from component level
      utils.translation.getSummary.invalidate({ sessionId });
    },
    onError: (error) => {
      toast.error(`生成摘要失敗: ${error.message}`);
    },
  });

  const handleGenerateSummary = () => {
    generateSummaryMutation.mutate({ sessionId });
  };

  const handleDownloadTranscript = () => {
    if (!transcripts || !session) return;

    const content = transcripts
      .map(
        (t) =>
          `[${new Date(t.timestamp).toLocaleTimeString()}]\n原文: ${t.originalText}\n譯文: ${t.translatedText}\n`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title}_逐字稿_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("逐字稿已下載");
  };

  const handleDownloadSummary = () => {
    if (!summaryData || !session) return;

    const blob = new Blob([summaryData.summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title}_摘要_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("摘要已下載");
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
              <p className="text-muted-foreground">請先登入以查看會話摘要</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{session.title}</CardTitle>
            <CardDescription>
              {session.sourceLanguage} → {session.targetLanguage}
              {session.scenario && ` | ${session.scenario}`}
              <br />
              開始時間: {new Date(session.startedAt).toLocaleString()}
              {session.endedAt && ` | 結束時間: ${new Date(session.endedAt).toLocaleString()}`}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Summary Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI 摘要</CardTitle>
              </div>
              {summaryData && (
                <Button variant="outline" size="sm" onClick={handleDownloadSummary}>
                  <Download className="mr-2 h-4 w-4" />
                  下載摘要
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : summaryData ? (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{summaryData.summaryText}</p>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">尚未生成摘要</p>
                <Button
                  onClick={handleGenerateSummary}
                  disabled={generateSummaryMutation.isPending}
                >
                  {generateSummaryMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成摘要
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcript Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>完整逐字稿</CardTitle>
              </div>
              {transcripts && transcripts.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleDownloadTranscript}>
                  <Download className="mr-2 h-4 w-4" />
                  下載逐字稿
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {transcriptsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transcripts && transcripts.length > 0 ? (
              <div className="space-y-4">
                {transcripts.map((t, idx) => (
                  <div key={t.id}>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </span>
                        {t.confidence && (
                          <span className="text-xs text-muted-foreground">
                            信心度: {t.confidence}%
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          原文
                        </span>
                        <p className="text-base">{t.originalText}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-primary uppercase">
                          譯文
                        </span>
                        <p className="text-base font-medium text-primary">{t.translatedText}</p>
                      </div>
                    </div>
                    {idx < transcripts.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">沒有逐字稿記錄</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center">
          <Button onClick={() => setLocation("/")} variant="outline">
            返回首頁
          </Button>
        </div>
      </div>
    </div>
  );
}
