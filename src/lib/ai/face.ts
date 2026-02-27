import { FaceRecognitionResult } from "@/lib/types";

/**
 * AI Module 3 – Face Recognition Simulation
 * Frontend simulation only. 85% success, 10% low confidence, 5% fail.
 */

export function simulateFaceRecognition(): Promise<FaceRecognitionResult> {
    return new Promise((resolve) => {
        // Simulate 1.5s processing time
        setTimeout(() => {
            const roll = Math.random() * 100;

            let verified: boolean;
            let confidence: number;
            let antiSpoofCheck: boolean;

            if (roll < 85) {
                // 85% success
                verified = true;
                confidence = 0.88 + Math.random() * 0.12; // 88-100%
                antiSpoofCheck = true;
            } else if (roll < 95) {
                // 10% low confidence
                verified = true;
                confidence = 0.55 + Math.random() * 0.15; // 55-70%
                antiSpoofCheck = Math.random() > 0.3;
            } else {
                // 5% fail
                verified = false;
                confidence = 0.1 + Math.random() * 0.3; // 10-40%
                antiSpoofCheck = false;
            }

            resolve({
                verified,
                confidence: Math.round(confidence * 100) / 100,
                antiSpoofCheck,
                device: "Webcam HD Pro",
                ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
            });
        }, 1500);
    });
}

export function getVerificationStatus(result: FaceRecognitionResult): {
    label: string;
    color: string;
    description: string;
} {
    if (!result.verified) {
        return {
            label: "Failed",
            color: "destructive",
            description: "Face verification failed. Please try again or contact admin.",
        };
    }
    if (result.confidence < 0.7) {
        return {
            label: "Low Confidence",
            color: "warning",
            description: `Verification passed with low confidence (${(result.confidence * 100).toFixed(0)}%). Manual review may be required.`,
        };
    }
    return {
        label: "Verified",
        color: "success",
        description: `Face verified successfully with ${(result.confidence * 100).toFixed(0)}% confidence.`,
    };
}
