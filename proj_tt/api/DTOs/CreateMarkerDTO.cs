﻿namespace TT_API.DTOs {
    public class CreateMarkerDTO {

        public int MarkerID { get; set; }
        public int IDMap { get; set; }
        public int IDLabel { get; set; }
        public string MarkerName { get; set; }
        public string MarkerDescription { get; set; }
        public float Latitude { get; set; }
        public float Longitude { get; set; }

    }
}
