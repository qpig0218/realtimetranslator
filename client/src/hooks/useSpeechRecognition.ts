import { useCallback, useEffect, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { trpc } from "@/lib/trpc";

interface UseSpeechRecognitionProps {
  sourceLanguage: string;
  onRecognized: (text: string, confidence?: number) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  sourceLanguage,
  onRecognized,
  onError,
}: UseSpeechRecognitionProps) {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);

  const { data: tokenData } = trpc.translation.getSpeechToken.useQuery();

  const startRecognition = useCallback(async () => {
    if (!tokenData) {
      onError?.("Speech token not available");
      return;
    }

    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
        tokenData.token,
        tokenData.region
      );

      // Map language codes for Speech SDK
      const speechLanguage = sourceLanguage === "zh-Hant" ? "zh-TW" : sourceLanguage;
      speechConfig.speechRecognitionLanguage = speechLanguage;

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognizing = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          setInterimText(e.result.text);
        }
      };

      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const text = e.result.text;
          const confidence = e.result.properties.getProperty(
            SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
          );
          
          let confidenceScore: number | undefined;
          try {
            const jsonResult = JSON.parse(confidence);
            const rawConfidence = jsonResult.NBest?.[0]?.Confidence;
            // Only set confidence if it's a valid number
            if (typeof rawConfidence === 'number' && !isNaN(rawConfidence)) {
              confidenceScore = Math.round(rawConfidence * 100);
            }
          } catch (error) {
            // Ignore parsing errors, confidence will remain undefined
            console.log('Failed to parse confidence:', error);
          }

          setInterimText("");
          onRecognized(text, confidenceScore);
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
          console.log("No speech recognized");
        }
      };

      recognizer.canceled = (s, e) => {
        console.error("Recognition canceled:", e.errorDetails);
        setIsRecognizing(false);
        onError?.(e.errorDetails || "Recognition canceled");
      };

      recognizer.sessionStopped = () => {
        setIsRecognizing(false);
        recognizer.stopContinuousRecognitionAsync();
      };

      recognizerRef.current = recognizer;
      recognizer.startContinuousRecognitionAsync(
        () => {
          setIsRecognizing(true);
        },
        (error) => {
          console.error("Failed to start recognition:", error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error("Speech recognition error:", error);
      onError?.(String(error));
    }
  }, [tokenData, sourceLanguage, onRecognized, onError]);

  const stopRecognition = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          setIsRecognizing(false);
          recognizerRef.current?.close();
          recognizerRef.current = null;
        },
        (error) => {
          console.error("Failed to stop recognition:", error);
          setIsRecognizing(false);
        }
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.close();
      }
    };
  }, []);

  return {
    isRecognizing,
    interimText,
    startRecognition,
    stopRecognition,
  };
}
