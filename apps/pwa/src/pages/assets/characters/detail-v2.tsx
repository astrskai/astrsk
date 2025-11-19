import { Trash2, ArrowLeft, X } from "lucide-react";
import { Route } from "@/routes/_layout/assets/characters/$characterId";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useQuery } from "@tanstack/react-query";
import { cardQueries } from "@/entities/card/api";
import { CharacterCard, Entry } from "@/entities/card/domain";
import { Button } from "@/shared/ui/forms";
import { useAsset } from "@/shared/hooks/use-asset";
import { Input, Textarea } from "@/shared/ui/forms";
import { useNavigate } from "@tanstack/react-router";
import { useScrollToTop } from "@/shared/hooks/use-scroll-to-top";
import { AccordionBase, AvatarSimple, ChatBubble } from "@/shared/ui";

const TABS = [
  { label: "Metadata", to: "#metadata", value: "metadata" },
  { label: "Character Info", to: "#character-info", value: "character-info" },
  { label: "Lorebook", to: "#lorebook", value: "lorebook" },
];

const TAG_DEFAULT = [
  "Male",
  "Female",
  "Non-Binary",
  "Famous",
  "Anime",
  "Game",
  "book",
  "Movie & TV",
  "Celebrity",
  "Real",
  "Non-Humab",
  "NSFW",
];

const LorebookItemTitle = ({
  name,
  onDelete,
}: {
  name: string;
  onDelete?: (e: React.MouseEvent) => void;
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion from toggling
    onDelete?.(e);
  };

  return (
    <div className="flex items-center justify-between">
      <div>{name}</div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleDelete}
        className="cursor-pointer text-gray-500 hover:text-gray-400"
        aria-label="Delete lorebook entry"
      >
        <Trash2 className="h-4 w-4" />
      </div>
    </div>
  );
};

const LorebookItemContent = ({ entry }: { entry: Entry }) => {
  return (
    <div className="space-y-2">
      <Input
        defaultValue={entry.name}
        label="Lorebook name"
        labelPosition="inner"
        placeholder="ex. Kingdom of Elaria"
      />
      <Input
        label="Trigger keywords"
        labelPosition="inner"
        placeholder="Add a keyword"
      />
      <ul className="flex flex-wrap gap-2">
        {entry.keys.map((key, index) => (
          <li
            key={`${entry.id}-${key}-${index}`}
            className="bg-background-primary flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm text-gray-50"
          >
            <span className="text-xs text-gray-200">{key}</span>
            <button className="text-gray-500 hover:text-gray-400">
              <X className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>
      <Input
        label="Recall range"
        labelPosition="inner"
        defaultValue={entry.recallRange}
        helpTooltip="Set the scan depth to determine how many messages are checked for triggers."
        caption="Min 0 / Max 10"
      />
      <Textarea
        defaultValue={entry.content}
        label="Description"
        labelPosition="inner"
        autoResize
        placeholder="Write your lorebook description"
        caption="These fields are used as prompts for AI conversations {{session.entries}}"
      />
    </div>
  );
};

const CharacterDetailPage = () => {
  const navigate = useNavigate();
  const { characterId } = Route.useParams();
  const characterIdEntity = characterId as unknown as UniqueEntityID;

  const { data: character } = useQuery(
    cardQueries.detail(characterIdEntity.toString()),
  );

  console.log(character?.props.lorebook);

  // Type guard to ensure character is CharacterCard
  const characterCard = character instanceof CharacterCard ? character : null;

  const [imageUrl] = useAsset(character?.props.iconAssetId);

  // Scroll to top when character changes
  useScrollToTop([characterId]);

  const handleGoBack = () => {
    navigate({ to: "/assets/characters" });
  };

  // Smooth scroll to section
  const handleTabClick = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const scrollContainer = document.querySelector("main.overflow-y-auto");
      if (scrollContainer) {
        const stickyNavHeight = 80;
        const sectionTop = section.offsetTop - stickyNavHeight;
        scrollContainer.scrollTo({
          top: sectionTop,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div className="bg-gray-900">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-5 w-5" />}
            size="sm"
            onClick={handleGoBack}
          />
          <h1 className="text-base font-semibold">{character?.props.title}</h1>
        </div>
        <div>
          <Button variant="secondary" icon={<Trash2 className="h-4 w-4" />}>
            Delete
          </Button>
        </div>
      </div>

      <div className="flex w-full">
        <div className="mx-auto w-4/5 max-w-5xl pb-6">
          <div className="sticky top-0 z-10 bg-gray-900 py-2">
            <nav className="flex items-center gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabClick(tab.value)}
                  className="bg-black-alternate text-text-secondary hover:bg-black-alternate/80 focus-visible:ring-ring inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-6">
            <section
              id="metadata"
              className="flex w-full flex-col items-center justify-center gap-4"
            >
              <div className="max-w-[200px] space-y-2 overflow-hidden rounded-lg">
                <img
                  src={imageUrl ?? "/img/placeholder/character-placeholder.png"}
                  alt={character?.props.title ?? ""}
                  className="h-full w-full object-cover"
                />

                <div className="flex items-center justify-between p-1">
                  <button className="text-gray-200">
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <Button variant="secondary">Upload image</Button>
                </div>
              </div>
              <Input
                defaultValue={character?.props.title}
                label="Character Name"
                labelPosition="inner"
                placeholder="Write down your character name."
                maxLength={50}
              />
              <Input
                defaultValue={character?.props.cardSummary}
                label="Character Summary"
                labelPosition="inner"
                placeholder="ex. Princess of Elaria"
                maxLength={80}
              />
              <Input
                defaultValue={character?.props.version}
                label="Version"
                labelPosition="inner"
                placeholder="ex. v1.0"
              />
              <Input
                defaultValue={character?.props.conceptualOrigin}
                label="Conceptual Origin"
                labelPosition="inner"
                placeholder="ex. Book, Movie, Original, etc."
              />
              <div className="flex w-full flex-col gap-2">
                <h3 className="text-text-secondary text-xs">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {TAG_DEFAULT.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="bg-background-primary rounded-md border border-gray-800 px-2 py-1 text-sm text-gray-50"
                    >
                      {tag}
                    </span>
                  ))}
                  {/* {character?.props.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="bg-background-card text-text-input-subtitle rounded-md px-2 py-1"
                >
                  {tag}
                </span>
              ))} */}
                </div>

                <Input label="Tag" labelPosition="inner" />
              </div>
            </section>

            <section id="character-info" className="space-y-4">
              <div>Character Info</div>
              <Textarea
                // ref={descriptionRef}
                label="Character Description"
                labelPosition="inner"
                defaultValue={characterCard?.props.description}
                // onChange={(e) => onDescriptionChange(e.target.value)}
                // onFocus={() => setActiveTextarea("description")}
                placeholder="Describe your character's personality, traits, and background..."
                required
                autoResize
              />
              <Textarea
                // ref={descriptionRef}
                label="Example Dialogue"
                labelPosition="inner"
                defaultValue={characterCard?.props.exampleDialogue}
                // onChange={(e) => onDescriptionChange(e.target.value)}
                // onFocus={() => setActiveTextarea("description")}
                placeholder="Enter your character's example dialogue..."
                required
                autoResize
              />
            </section>

            <section id="lorebook" className="space-y-4">
              <div>Lorebook</div>

              <AccordionBase
                items={
                  (character?.props.lorebook?.props.entries ?? []).map(
                    (entry) => ({
                      title: <LorebookItemTitle name={entry.name} />,
                      content: <LorebookItemContent entry={entry} />,
                      value: entry.id.toString(),
                    }),
                  ) ?? []
                }
              />
            </section>
          </div>
        </div>

        <div className="bg-background-primary hidden w-1/5 flex-col p-4 md:flex">
          <div>
            <h3 className="text-text-secondary text-xs">Character preview</h3>
            <div className="flex items-start gap-2">
              <AvatarSimple
                src={imageUrl ?? "/img/placeholder/character-placeholder.png"}
                alt={character?.props.title ?? ""}
                size="lg"
              />

              <div className="space-y-2">
                <p className="w-fit rounded-full bg-gray-50/10 px-3 py-1 text-xs font-medium backdrop-blur-sm md:text-sm">
                  {character?.props.title}
                </p>

                <ChatBubble direction="left">
                  I'm {character?.props.title}
                </ChatBubble>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetailPage;
