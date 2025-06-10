namespace TT_API.DTOs
{
    public class MergeJourneysDTO
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int IDMap { get; set; }
        public List<int> JourneyIDs { get; set; }
    }
} 