export default {
  demos: [
    {
      id: 'accessible-lab-safety',
      title: 'Accessible lab safety video',
      description:
        'Local native video with captions, transcript, label, and resolved accessibility declarations.',
      tags: ['video', 'stimulus', 'captions', 'transcript', 'accessibility'],
      model: {
        id: 'video-stimulus-1',
        element: 'video-stimulus',
        language: 'en',
        media: {
          version: 1,
          id: 'lab-safety-demonstration',
          kind: 'video',
          label: 'Lab safety demonstration',
          description: 'Watch how the student prepares to handle a heated container safely.',
          lang: 'en',
          sources: [
            {
              src: '/video-stimulus/sample.webm',
              type: 'video/webm',
            },
          ],
          tracks: [
            {
              src: '/video-stimulus/captions-en.vtt',
              kind: 'captions',
              lang: 'en',
              label: 'English',
              default: true,
            },
          ],
          transcript: {
            lang: 'en',
            plainText:
              'Step one. Put on safety goggles before handling laboratory materials. Step two. Use heat-resistant gloves when touching a heated container. Step three. Place the container on a heat-safe surface, away from paper.',
          },
        },
        presentation: {
          showLabel: true,
          showDescription: true,
          transcriptInitiallyExpanded: false,
        },
        accessibilityProfile: {
          audioContent: 'meaningful',
          captionSupport: 'track',
          visualSupport: 'described',
        },
      },
    },
  ],
};
