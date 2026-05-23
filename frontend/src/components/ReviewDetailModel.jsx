import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const ReviewDetailModal = ({ review, isOpen, onClose }) => {
  if (!review) return null;

  const errors = review.errors || review.issues || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span>Analysis Details</span>
            <Badge variant="secondary" className="capitalize">
              {review.mode}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Language</p>
                <p className="font-medium capitalize">{review.language}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(review.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Score</p>
                <p className="font-medium">{review.aiScore ?? 0}/100</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="font-medium">{errors.length}</p>
              </div>
            </div>

<div>
                <h3 className="font-semibold mb-2">Input Code</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                <code>{review.input}</code>
              </pre>
            </div>

<div>
                <h3 className="font-semibold mb-2">Corrected Code</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                <code>{review.correctedCode}</code>
              </pre>
            </div>

<div>
                <h3 className="font-semibold mb-2">Explanation</h3>
              <p className="text-sm whitespace-pre-wrap">{review.explanation}</p>
            </div>

            {review.modeOutput ? (
              <div>
                <h3 className="font-semibold mb-2">Mode Output</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                  {review.modeOutput}
                </pre>
              </div>
            ) : null}

            {errors.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-2">Issues</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDetailModal;