import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";

const reviews = [
  {
    name: "Sarah Chen",
    username: "@sarahchen",
    body: "The AI-generated flashcards have revolutionized my IELTS prep! It creates perfect questions from my study materials.",
    img: "https://avatar.vercel.sh/sarahchen",
  },
  {
    name: "Alex Kumar",
    username: "@alexdev",
    body: "As a software developer, this is perfect for learning new programming concepts. The AI extracts key points brilliantly.",
    img: "https://avatar.vercel.sh/alexdev",
  },
  {
    name: "Dr. Emily Smith",
    username: "@drsmith",
    body: "Medical school just got easier! The AI helps create flashcards for complex medical terminology and concepts.",
    img: "https://avatar.vercel.sh/drsmith",
  },
  {
    name: "Michael Johnson",
    username: "@mjohnson",
    body: "Preparing for my CPA exam with this app. It generates relevant questions from my study materials automatically.",
    img: "https://avatar.vercel.sh/mjohnson",
  },
  {
    name: "Lisa Wong",
    username: "@lwong",
    body: "I use this for my kids' education. The AI creates age-appropriate questions that make learning fun and engaging.",
    img: "https://avatar.vercel.sh/lwong",
  },
  {
    name: "James Anderson",
    username: "@janderson",
    body: "Perfect for history studies! The AI creates connected questions that help understand historical events better.",
    img: "https://avatar.vercel.sh/janderson",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm dark:text-white/80">{body}</blockquote>
    </figure>
  );
};

export function TestimonialSection() {
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl space-y-6 text-center mb-16">
          <h2 className="text-center text-4xl font-semibold lg:text-5xl">Loved by Students Worldwide</h2>
          <p className="text-lg text-muted-foreground">See how FlashAI is transforming the way people learn and study</p>
        </div>
   
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee pauseOnHover className="[--duration:20s]">
            {firstRow.map((review) => (
              <ReviewCard key={review.username} {...review} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:20s]">
            {secondRow.map((review) => (
              <ReviewCard key={review.username} {...review} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
        </div>
      </div>
    </section>
  );
}
