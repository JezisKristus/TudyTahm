namespace TT_API.DTOs {
    public class CreateMarkerDTO {

        public int IDUser { get; set; }
        public string MarkerName { get; set; }
        public string MarkerDescription { get; set; }
        public string MarkerIconPath { get; set; }

        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

    }
}
