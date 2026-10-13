export const markupToText = (s: string | undefined) => {
    return (s || '').replace(/(<([^>]+)>)/ig, '');
};
