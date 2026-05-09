const IndexKeyList = ({ items }: { items: string[] }) => (
  <ul>
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

const ConditionalRenderBug = ({ items }: { items: string[] }) => (
  <div>
    {items.length && (
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )}
  </div>
);

const PreventDefaultForm = () => (
  <form
    onSubmit={(event) => {
      event.preventDefault();
    }}
  >
    <button type="submit">Submit</button>
  </form>
);

export { IndexKeyList, ConditionalRenderBug, PreventDefaultForm };
